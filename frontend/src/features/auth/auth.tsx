import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { flushSyncQueue } from "../sync/syncService";

export type AuthProviderName = "email" | "google" | "apple";

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  provider: AuthProviderName;
}

interface AuthSession {
  user: AppUser;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

interface LocalAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

interface AuthContextValue {
  user: AppUser | null;
  isAuthenticated: boolean;
  signInWithOAuth: (provider: Exclude<AuthProviderName, "email">) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<AppUser>;
  signUpWithPassword: (input: { name: string; email: string; password: string }) => Promise<AppUser>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const sessionStorageKey = "class-manager-auth-session";
const legacyUserStorageKey = "class-manager-auth-user";
const localAccountsStorageKey = "class-manager-local-auth-accounts";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readStoredSession(): AuthSession | null {
  const rawSession = window.localStorage.getItem(sessionStorageKey);
  if (rawSession) {
    try {
      return JSON.parse(rawSession) as AuthSession;
    } catch {
      window.localStorage.removeItem(sessionStorageKey);
    }
  }

  const legacyUser = window.localStorage.getItem(legacyUserStorageKey);
  if (legacyUser) {
    try {
      const user = JSON.parse(legacyUser) as AppUser;
      return { user };
    } catch {
      window.localStorage.removeItem(legacyUserStorageKey);
    }
  }

  return null;
}

function persistSession(session: AuthSession | null) {
  if (!session) {
    window.localStorage.removeItem(sessionStorageKey);
    window.localStorage.removeItem(legacyUserStorageKey);
    return;
  }

  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
  window.localStorage.setItem(legacyUserStorageKey, JSON.stringify(session.user));
}

function readLocalAccounts(): LocalAccount[] {
  const raw = window.localStorage.getItem(localAccountsStorageKey);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as LocalAccount[];
  } catch {
    window.localStorage.removeItem(localAccountsStorageKey);
    return [];
  }
}

function writeLocalAccounts(accounts: LocalAccount[]) {
  window.localStorage.setItem(localAccountsStorageKey, JSON.stringify(accounts));
}

function randomId(prefix: string) {
  if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  window.crypto?.getRandomValues?.(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("") || Math.random().toString(16);
}

async function hashPassword(password: string, salt: string) {
  const source = `${password}:${salt}`;

  if (window.crypto?.subtle) {
    const bytes = new TextEncoder().encode(source);
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(index);
    hash |= 0;
  }
  return `${hash}`;
}

function supabaseHeaders(accessToken?: string) {
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${accessToken || supabaseAnonKey}`,
    "Content-Type": "application/json",
  };
}

async function parseSupabaseError(response: Response) {
  try {
    const payload = await response.json();
    return payload.error_description || payload.msg || payload.message || "인증 요청에 실패했습니다.";
  } catch {
    return "인증 요청에 실패했습니다.";
  }
}

function mapSupabaseUser(rawUser: any, provider: AuthProviderName = "email"): AppUser {
  const email = rawUser?.email || "";
  const name = rawUser?.user_metadata?.name || rawUser?.user_metadata?.full_name || email.split("@")[0];

  return {
    id: rawUser?.id || randomId("supabase-user"),
    email,
    name,
    provider,
  };
}

async function signInWithSupabase(email: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify({ email: normalizeEmail(email), password }),
  });

  if (!response.ok) {
    await parseSupabaseError(response);
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  const payload = await response.json();
  return {
    user: mapSupabaseUser(payload.user, "email"),
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: payload.expires_in ? Date.now() + payload.expires_in * 1000 : undefined,
  };
}

async function signUpWithSupabase(input: { name: string; email: string; password: string }): Promise<AuthSession> {
  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify({
      email: normalizeEmail(input.email),
      password: input.password,
      data: { name: input.name.trim() },
    }),
  });

  if (!response.ok) {
    const message = await parseSupabaseError(response);
    throw new Error(message);
  }

  const payload = await response.json();
  if (payload.access_token && payload.user) {
    return {
      user: mapSupabaseUser(payload.user, "email"),
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresAt: payload.expires_in ? Date.now() + payload.expires_in * 1000 : undefined,
    };
  }

  return signInWithSupabase(input.email, input.password);
}

async function sendSupabasePasswordReset(email: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/recover`, {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify({ email: normalizeEmail(email) }),
  });

  if (!response.ok) {
    const message = await parseSupabaseError(response);
    throw new Error(message);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());

  const updateSession = (nextSession: AuthSession | null) => {
    setSession(nextSession);
    persistSession(nextSession);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.user),
      async signInWithOAuth(provider) {
        if (hasSupabase) {
          const redirectTo = window.location.origin;
          window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(
            redirectTo,
          )}`;
          return;
        }

        updateSession({
          user: {
            id: randomId(`${provider}-demo`),
            email: `${provider}.user@example.com`,
            name: provider === "google" ? "Google User" : "Apple User",
            provider,
          },
        });
        void flushSyncQueue();
      },
      async signInWithPassword(email, password) {
        if (hasSupabase) {
          const nextSession = await signInWithSupabase(email, password);
          updateSession(nextSession);
          void flushSyncQueue();
          return nextSession.user;
        }

        const normalizedEmail = normalizeEmail(email);
        const account = readLocalAccounts().find((item) => item.email === normalizedEmail);
        if (!account) throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");

        const passwordHash = await hashPassword(password, account.salt);
        if (passwordHash !== account.passwordHash) throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");

        const nextSession = {
          user: {
            id: account.id,
            email: account.email,
            name: account.name,
            provider: "email" as const,
          },
        };
        updateSession(nextSession);
        void flushSyncQueue();
        return nextSession.user;
      },
      async signUpWithPassword(input) {
        if (hasSupabase) {
          const nextSession = await signUpWithSupabase(input);
          updateSession(nextSession);
          void flushSyncQueue();
          return nextSession.user;
        }

        const accounts = readLocalAccounts();
        const email = normalizeEmail(input.email);
        if (accounts.some((item) => item.email === email)) {
          throw new Error("이미 가입된 이메일입니다.");
        }

        const salt = randomSalt();
        const account: LocalAccount = {
          id: randomId("local-user"),
          name: input.name.trim(),
          email,
          passwordHash: await hashPassword(input.password, salt),
          salt,
          createdAt: new Date().toISOString(),
        };

        writeLocalAccounts([...accounts, account]);

        const nextSession = {
          user: {
            id: account.id,
            email: account.email,
            name: account.name,
            provider: "email" as const,
          },
        };
        updateSession(nextSession);
        void flushSyncQueue();
        return nextSession.user;
      },
      async sendPasswordReset(email) {
        if (hasSupabase) {
          await sendSupabasePasswordReset(email);
          return;
        }

        const account = readLocalAccounts().find((item) => item.email === normalizeEmail(email));
        if (!account) throw new Error("가입된 이메일을 찾을 수 없습니다.");
      },
      async signOut() {
        if (hasSupabase && session?.accessToken) {
          await fetch(`${supabaseUrl}/auth/v1/logout`, {
            method: "POST",
            headers: supabaseHeaders(session.accessToken),
          }).catch(() => undefined);
        }
        updateSession(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
