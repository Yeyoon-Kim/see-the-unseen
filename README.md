# See the Unseen MVP

보이지 않던 계획, 우선순위, 준비 과정, 작은 할 일을 선명한 하루로 정리하는 Vite 기반 생산성 웹앱입니다. 대시보드에서 오늘 할 일, 오늘 일정, 디데이, 파일 업로드를 보고, 고정 일정에서는 반복 일정과 루틴을 관리합니다.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: Prisma + SQLite
- Assistant features: OpenAI API adapter with mock fallback
- Auth: Supabase Auth when configured, local-only demo auth otherwise
- Calendar: iCalendar `.ics` export

## Local Setup

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
npm install
npm run install:all
npm run db:init
npm run seed
npm run dev
```

For local API proxying, set this in `frontend/.env`:

```env
VITE_DEV_API_TARGET=http://127.0.0.1:4000
```

Default local URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:4000`

## Vercel Deploy

Deploy the frontend as a Vite static app.

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

This repository includes `vercel.json` so Vercel installs frontend dependencies, builds the Vite app, and copies `frontend/dist` to root `dist`.

The Express/SQLite backend is not bundled into the Vite static output. For deployed API features, host the backend separately and set:

```env
VITE_API_URL=https://your-api.example.com/api
```

If `VITE_API_URL` is empty, the frontend calls same-origin `/api`.

## Environment

Root `.env.example` documents all values. Frontend-only values are also listed in `frontend/.env.example`.

Required for real auth/sync:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Optional backend values:

```env
DATABASE_URL="file:./dev.db"
PORT=4000
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
FRONTEND_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

`OPENAI_API_KEY`를 비워두면 mock response를 반환합니다. Supabase 값이 비어 있으면 로그인은 로컬 데모 모드로 동작하며, 비밀번호는 평문이 아니라 salt + hash로 저장됩니다.

## Build Check

```bash
npm run build
```

빌드가 끝나면 Vercel 기준 산출물인 root `dist/`가 생성됩니다.

## API Check

```bash
curl http://127.0.0.1:4000/health
curl http://127.0.0.1:4000/api/courses
curl http://127.0.0.1:4000/api/dashboard
curl -X POST http://127.0.0.1:4000/api/ai/analyze-syllabus \
  -H "Content-Type: application/json" \
  -d '{"text":"Introduction to Linguistics, Professor Kim, Final Essay due 2026-06-20"}'
curl -L "http://127.0.0.1:4000/api/calendar/export" -o class-manager.ics
```

## MVP Flow

1. 대시보드에서 `오늘 할 일`, `오늘 일정`, `디데이`, `파일 업로드` 중 하나를 선택합니다.
2. 파일 업로드에서 계획서, 공지 캡처, PDF, Word, 이미지 자료를 분석합니다.
3. 고정 일정에서 루틴/세미나/회의 같은 반복 일정을 요일과 시간 기준으로 저장합니다.
4. 설정에서 언어, 시간대, 캘린더 export, 동기화 상태를 확인합니다.
