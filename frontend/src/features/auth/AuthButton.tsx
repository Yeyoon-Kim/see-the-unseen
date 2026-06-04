import { ChevronDown, LogIn, LogOut, UserCircle, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth";

type AuthMode = "login" | "signup" | "reset";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function AuthButton() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    sendPasswordReset,
    signInWithOAuth,
    signInWithPassword,
    signOut,
    signUpWithPassword,
    user,
  } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const openAuthModal = (nextMode: AuthMode = "login") => {
    setMode(nextMode);
    setForm(initialForm);
    setError("");
    setMessage("");
    setModalOpen(true);
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setMessage("");
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setMessage("");
  };

  const validateLogin = () => {
    if (!form.email.trim() || !form.password) return "이메일과 비밀번호를 입력해주세요.";
    if (!isValidEmail(form.email)) return "올바른 이메일 형식으로 입력해주세요.";
    return "";
  };

  const validateSignup = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      return "이름, 이메일, 비밀번호를 모두 입력해주세요.";
    }
    if (!isValidEmail(form.email)) return "올바른 이메일 형식으로 입력해주세요.";
    if (form.password.length < 8) return "비밀번호는 최소 8자 이상이어야 합니다.";
    if (form.password !== form.confirmPassword) return "비밀번호와 비밀번호 확인이 일치하지 않습니다.";
    return "";
  };

  const validateReset = () => {
    if (!form.email.trim()) return "이메일을 입력해주세요.";
    if (!isValidEmail(form.email)) return "올바른 이메일 형식으로 입력해주세요.";
    return "";
  };

  const closeModal = () => {
    if (loading) return;
    setModalOpen(false);
    setError("");
    setMessage("");
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateLogin();
    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await signInWithPassword(form.email, form.password);
      setModalOpen(false);
      navigate("/");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateSignup();
    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await signUpWithPassword({ name: form.name, email: form.email, password: form.password });
      setModalOpen(false);
      navigate("/");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateReset();
    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await sendPasswordReset(form.email);
      setMessage("비밀번호 재설정 안내를 보냈습니다. 메일함을 확인해주세요.");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "메일 발송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="relative">
        <button
          className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md border border-line bg-card px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
          type="button"
          onClick={() => setAccountMenuOpen((current) => !current)}
        >
          <span className="flex min-w-0 items-center gap-2">
            <UserCircle className="shrink-0 text-accent" size={18} />
            <span className="truncate">{user?.name || user?.email || "계정"}</span>
          </span>
          <ChevronDown size={14} />
        </button>

        {accountMenuOpen && (
          <div className="absolute left-0 top-full z-20 mt-2 grid w-56 gap-1 rounded-lg border border-line bg-white p-2 text-sm shadow-soft md:bottom-full md:top-auto md:mb-2 md:mt-0">
            <div className="rounded-md bg-large px-3 py-2">
              <p className="font-semibold text-slate-700">계정 정보</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-left font-semibold text-slate-700 hover:bg-medium"
              type="button"
              onClick={async () => {
                await signOut();
                setAccountMenuOpen(false);
              }}
            >
              <LogOut size={16} />
              로그아웃
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button className="btn-primary min-h-11 w-full px-3 py-2" type="button" onClick={() => openAuthModal("login")}>
        <LogIn size={16} />
        로그인
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-line bg-white p-6 shadow-soft">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {mode === "login" && "로그인"}
                  {mode === "signup" && "회원가입"}
                  {mode === "reset" && "비밀번호 찾기"}
                </h2>
              </div>
              <button
                className="flex size-10 items-center justify-center rounded-md text-slate-500 hover:bg-medium"
                type="button"
                aria-label="닫기"
                onClick={closeModal}
              >
                <X size={18} />
              </button>
            </div>

            {mode === "login" && (
              <form className="grid gap-4" onSubmit={handleLogin}>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  이메일
                  <input
                    className="input"
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="name@example.com"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  비밀번호
                  <input
                    className="input"
                    type="password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    placeholder="8자 이상"
                  />
                </label>

                {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

                <button className="btn-primary min-h-11 justify-center" type="submit" disabled={loading}>
                  {loading ? "로그인 중..." : "로그인"}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-secondary min-h-11 justify-center" type="button" onClick={() => signInWithOAuth("google")}>
                    Google
                  </button>
                  <button className="btn-secondary min-h-11 justify-center" type="button" onClick={() => signInWithOAuth("apple")}>
                    Apple
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                  <button className="text-accent hover:underline" type="button" onClick={() => switchMode("signup")}>
                    회원가입
                  </button>
                  <button className="text-slate-500 hover:text-accent hover:underline" type="button" onClick={() => switchMode("reset")}>
                    비밀번호 찾기
                  </button>
                </div>
              </form>
            )}

            {mode === "signup" && (
              <form className="grid gap-4" onSubmit={handleSignup}>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  이름
                  <input
                    className="input"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="홍길동"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  이메일
                  <input
                    className="input"
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="name@example.com"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  비밀번호
                  <input
                    className="input"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    placeholder="8자 이상"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  비밀번호 확인
                  <input
                    className="input"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(event) => updateField("confirmPassword", event.target.value)}
                    placeholder="비밀번호 재입력"
                  />
                </label>

                {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

                <button className="btn-primary min-h-11 justify-center" type="submit" disabled={loading}>
                  {loading ? "가입 중..." : "회원가입"}
                </button>

                <button className="text-sm font-semibold text-accent hover:underline" type="button" onClick={() => switchMode("login")}>
                  이미 계정이 있으신가요? 로그인
                </button>
              </form>
            )}

            {mode === "reset" && (
              <form className="grid gap-4" onSubmit={handleReset}>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  이메일
                  <input
                    className="input"
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="name@example.com"
                  />
                </label>

                {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
                {message && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{message}</p>}

                <button className="btn-primary min-h-11 justify-center" type="submit" disabled={loading}>
                  {loading ? "발송 중..." : "비밀번호 재설정 메일 보내기"}
                </button>

                <button className="text-sm font-semibold text-accent hover:underline" type="button" onClick={() => switchMode("login")}>
                  로그인으로 돌아가기
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
