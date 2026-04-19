---
adr: 0013
title: LLM 프로바이더 추상화 — Anthropic + Gemini 듀얼 지원
status: Accepted
date: 2026-04-20
---

# ADR-0013: LLM 프로바이더 추상화 — Anthropic + Gemini 듀얼 지원

## Status

Accepted

## Context

기능 3 기획 명세 v0.2의 "5. 도메인·기술 결정 요약"은 LLM 프로바이더를 Anthropic(Claude) 단독으로 명시했다. D2(SSE 스트리밍 인프라) 구현 중 다음 제약·기회가 드러나 결정을 확장한다.

### 1. 비용 제약

개인 학습 프로젝트이고 Anthropic API 크레딧이 제한적이다. 기능 3~5는 LLM 스트리밍 호출이 반복 테스트의 기본이 되는 영역이라, 개발·실험 중 지속 호출할 무료 대안이 실질적으로 필요하다. Gemini(`gemini-2.0-flash`)는 관대한 무료 티어를 제공한다.

### 2. 프로바이더 비교가 학습 가치

프로젝트의 핵심 가치 2번(실시간 UX의 저수준 직접 구현)에 비추어, 두 프로바이더의 스트리밍 API 차이를 직접 구현·비교하는 것은 학습 목표와 정합한다.

- Anthropic: `messages.create({ stream: true })` → `RawMessageStreamEvent`의 `content_block_delta`/`message_stop` 이벤트 순회
- Gemini: `models.generateContentStream()` → `chunk.text`를 직접 순회하는 단순 형태
- 시스템 프롬프트 전달 방식(`system` vs `systemInstruction`), 메시지 role 용어(`assistant` vs `model`) 등 미묘한 차이

이 차이를 흡수해야 하는 경계를 의식적으로 설계하는 것 자체가 학습 지점이다.

### 3. 저수준 학습 원칙과의 충돌 여부

기획 명세는 "AI SDK / Vercel AI SDK 사용 금지"를 명시했다. 프로바이더 추상화가 이 원칙에 저촉되는지 점검이 필요하다.

결론: **저촉하지 않는다.** 금지 대상은 **프로바이더 간 통합을 담당하는 외부 라이브러리**(AI SDK, Vercel AI SDK, LangChain 등)다. 우리 프로젝트 내부에 **최소 포트(port)** 를 두고 각 프로바이더 SDK의 원시 스트림을 여전히 직접 순회하는 것은 "저수준 직접 구현" 원칙과 양립 가능하다. 오히려 프로바이더별 원시 API를 양쪽 모두 다뤄야 하므로 학습 표면이 넓어진다.

## Decision

### 1. Anthropic + Gemini 둘 다 1급 지원

단순 fallback이 아니다. 운영 중 선택 가능한 대등한 선택지로 취급한다. 개발 기간 종료 후에도 비용·가용성 상황에 따라 어느 쪽이든 기본이 될 수 있다.

### 2. 최소 인터페이스 `LLMProvider`만 추상화

`develop/lib/llm/types.ts`:

```ts
export interface LLMMessage {
  role: 'user' | 'assistant'
  content: string
}

export type LLMStreamChunk =
  | { type: 'text'; text: string }
  | { type: 'done' }

export interface LLMProvider {
  stream(messages: LLMMessage[], systemPrompt: string): AsyncIterable<LLMStreamChunk>
}
```

SSE Route Handler는 이 인터페이스 뒤의 프로바이더에 무지하다. 청크 → SSE 이벤트 변환, citation 파싱, DB 영속은 프로바이더 무관 공통 레이어에서 처리된다.

### 3. 프로바이더별 SDK는 여전히 저수준 직접 사용

각 구현체는 SDK의 원시 스트림 타입을 그대로 다룬다. 프로바이더 간 통합 추상화 라이브러리(AI SDK / Vercel AI SDK / LangChain 등)는 **계속 금지**한다.

### 4. 환경 변수 기반 자동 선택

`develop/lib/llm/provider.ts`의 우선순위:

1. `LLM_PROVIDER` 명시 값 (`anthropic` | `gemini`)이 있으면 해당 프로바이더. 키가 없으면 에러
2. 미설정이면 `ANTHROPIC_API_KEY` 존재 시 Anthropic
3. 미설정이면 `GEMINI_API_KEY` 존재 시 Gemini
4. 둘 다 없으면 런타임 에러 (설정 안내 문구 포함)

프로바이더 인스턴스는 모듈 레벨에서 캐시한다 (서버리스 cold start 최적화).

## 고려한 대안

### 안 A: Anthropic 단독 (PRD v0.2)

| 축 | 평가 |
|---|---|
| 구현 복잡도 | ✅ 추상화 레이어 없이 단순 |
| 비용 유연성 | ❌ 크레딧 소진 시 개발 중단 |
| 학습 가치 | 🟡 단일 프로바이더 깊이 학습은 가능하나 비교 학습 기회 없음 |

**기각**: 비용 제약으로 개발 지속성이 위협받는다.

### 안 B: Gemini 단독으로 전환

| 축 | 평가 |
|---|---|
| 구현 복잡도 | ✅ 단순 |
| 비용 | ✅ 무료 |
| 학습 가치 | 🟡 Anthropic(SSE 학습의 주요 레퍼런스) 미경험 |
| 유연성 | ❌ Gemini 모델·API 변경 리스크를 혼자 흡수 |

**기각**: Anthropic 스트리밍 API 학습 기회 소실. 단일 벤더 의존 유지.

### 안 C: Anthropic 주 + Gemini fallback

단순 환경변수 체크로 Gemini를 "Anthropic 실패 시 대체"로 쓴다.

| 축 | 평가 |
|---|---|
| 구현 복잡도 | 🟡 Route Handler 안에 프로바이더 분기 발생 |
| 비용 유연성 | ✅ 전환 가능 |
| 학습 가치 | 🟡 한쪽은 2급 시민 — 기능별 차이를 동등 비교하기 어려움 |
| 확장성 | ❌ 두 번째 프로바이더가 구조적으로 부차적이라 이후 다른 프로바이더 추가 시 재작성 |

**기각**: Q2(1급 vs fallback)에서 명시적으로 "둘 다 1급"으로 결정됨.

### 안 D: 최소 인터페이스 추상화 + 듀얼 1급 (채택)

| 축 | 평가 |
|---|---|
| 구현 복잡도 | 🟡 `LLMProvider` 인터페이스 + 2개 구현체 + 팩토리. 초기 비용 있으나 후속 기능에서 회수 |
| 비용 유연성 | ✅ 어느 쪽이든 대등하게 사용 |
| 학습 가치 | ✅ 두 원시 API 비교 + 추상화 경계 설계 경험 |
| 확장성 | ✅ 이후 프로바이더 추가 시 인터페이스만 구현 |
| 저수준 학습 원칙 유지 | ✅ 프로바이더 통합 라이브러리 미사용, SDK 원시 스트림 직접 순회 |

**채택**: 비용·학습·확장성 모두 양립. 추상화 레이어가 최소(`stream()` 단 하나)라 과설계 리스크도 낮다.

## 결과

### Pros

- **비용 유연성**: Anthropic rate limit / 크레딧 소진 시 Gemini로 즉시 전환. 환경변수만 교체
- **비교 학습**: 두 프로바이더 스트리밍 API·메시지 포맷·citation 처리 방식 차이를 직접 경험
- **Route Handler 불변**: 프로바이더 교체·추가가 SSE 레이어에 영향 없음
- **후속 기능 재사용**: 기능 5(Write AI 수정 제안), 6(Scholar)은 이 인터페이스에 프롬프트·컨텍스트만 갈아끼움
- **저수준 학습 원칙 유지**: 외부 프로바이더 통합 라이브러리 미사용

### Cons

- **테스트 표면 2배**: golden path를 양쪽 프로바이더에서 수동 검증 필요
- **미묘한 동작 차이 흡수 부담**: citation 형식, tool use, 응답 스타일 등은 공통 레이어가 흡수하지 않음 — 기능별 개별 대응
- **추상화가 새는 지점 존재**: 시스템 프롬프트 해석 방식(`system` vs `systemInstruction`)은 구현체가 처리하지만, 모델 특성(context window 크기 등)은 호출부가 의식할 수 있음
- **의존성 증가**: `@google/genai` 패키지 1개 추가

### 학습 원칙 점검

"AI SDK / Vercel AI SDK / LangChain 사용 금지"는 **계속 유효**하다. `LLMProvider`는 프로바이더 통합 라이브러리가 아니라 **프로젝트 내부에서 직접 설계한 포트**다. 각 SDK의 원시 스트림 타입(Anthropic `RawMessageStreamEvent`, Gemini `generateContentStream`의 청크)은 구현체 안에서 그대로 다룬다.

## 연관 결정

- 기획 명세: [plan/features/3-liner.md](../../plan/features/3-liner.md) v0.3 — 이 결정을 §5 테이블에 반영
- 관련 파일:
  - `develop/lib/llm/types.ts` — 인터페이스 정의
  - `develop/lib/llm/provider.ts` — 환경변수 기반 팩토리
  - `develop/lib/llm/anthropic.ts` — Anthropic 구현체
  - `develop/lib/llm/gemini.ts` — Gemini 구현체
  - `develop/app/api/chat/[chatId]/messages/route.ts` — 프로바이더 무지의 SSE Route Handler
