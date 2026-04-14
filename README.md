# linor-cloning-liner

라이너(Liner)의 세 서비스(Liner / Liner Write / Liner Scholar)를 분석하고, 하나의 Next.js 앱으로 통합 재구현하는 1인 학습용 클론 코딩 프로젝트.

## 해결하려는 문제

1. **학습 관점** — 원본이 세 개의 독립 서비스로 분리한 것을 하나의 Next.js 앱으로 통합했을 때 생기는 구조와 트레이드오프를 직접 구현으로 파악한다.
2. **프로덕트 관점** — 원본의 약점인 "서비스 간 연동 부족, 컬렉션/문서/채팅 컨텍스트 분리"를 통합 앱 형태로 개선할 수 있는지 시도한다.

## 대상 사용자

아이디어 서칭 → 초고 작성 → 브레인스토밍을 반복하며 기획 산출물을 만드는 **스타트업 PM**. 사용자 본인의 자기 시뮬레이션 페르소나.

## 구조

이 저장소는 Claude Code 오케스트레이션 기반 멀티 역할 템플릿 위에 구축되었다.

```
plan/           ← Product Manager (기능 명세, PRD)
design/         ← UI/UX Designer (사용자 흐름, 화면 설계)
develop/        ← Fullstack Developer (Next.js 앱 구현 전반)
qa/             ← QA Engineer (테스트 케이스, 품질 리포트)
features.md     ← 기능별 산출물 인덱스
CLAUDE.md       ← 오케스트레이션 규칙 및 프로젝트 개요
```

각 역할은 독립 디렉터리를 가지며, Claude Code가 루트에서 작업 시 Orchestrator로 동작하며 역할을 순차/병렬 위임한다. 상세는 [`CLAUDE.md`](CLAUDE.md) 및 각 역할의 `CLAUDE.md` 참조.

## 기술 스택

- **Next.js** (App Router, 최신 안정화 버전) + **TypeScript**
- **Tailwind CSS**
- **TipTap** (ProseMirror 기반 WYSIWYG 에디터)
- **React Query** + Context/useState 기반 상태 관리. Zustand는 MVP 완성 후 학습 프로세스 단계에서 부분 도입 예정
- **PostgreSQL** + **Prisma**
- **NextAuth** (인증)
- **Anthropic 공식 SDK** (`@anthropic-ai/sdk`) — LLM 응답 SSE 스트리밍을 저수준에서 직접 구현
- 로컬 개발 전용 (현재 단계)

## 템플릿 가이드

이 저장소가 기반한 멀티 역할 템플릿의 구조와 사용법은 [`TEMPLATE.md`](TEMPLATE.md) 참조.
