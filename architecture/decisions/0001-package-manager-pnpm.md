---
adr: 0001
title: 패키지 매니저로 pnpm 채택
status: Accepted
date: 2026-04-14
---

# ADR-0001: 패키지 매니저로 pnpm 채택

## Status

Accepted

## Context

이 프로젝트의 자바스크립트 패키지 매니저를 선택해야 한다. 고려한 대안은 `npm`, `pnpm`, `yarn`, `bun`이다. 이 프로젝트는 Next.js 기반 1인 학습용 풀스택 앱이며, 한 명의 개발자가 여러 학습 프로젝트를 병행할 가능성이 있다.

## Decision

**pnpm**을 사용한다.

## 고려한 대안

### pnpm vs npm (핵심 비교)

| 축 | npm | pnpm |
|---|---|---|
| 저장 방식 | 각 프로젝트의 `node_modules`에 **복사** | 전역 content-addressable store(`~/.pnpm-store`)에 **한 번 저장**, 프로젝트 `node_modules`엔 하드링크 |
| 디스크 효율 | 프로젝트 수에 선형 비례 | 여러 프로젝트가 동일 버전 공유 (중복 제로) |
| `node_modules` 구조 | flat (호이스팅) | nested (strict) — 실체는 `node_modules/.pnpm/` 하위, 선언된 직접 의존성만 최상위 symlink |
| Phantom dependency | **발생 가능** — 선언하지 않은 transitive dep을 `import` 가능 | **차단** — 선언된 의존성만 접근 가능 |
| 설치 속도 | 보통 (네트워크 + 디스크 쓰기) | 더 빠름 (store 재사용 + 링크) |
| Lock 파일 | `package-lock.json` | `pnpm-lock.yaml` |
| 모노레포 | `workspaces` 지원 | `workspaces` + `--filter` (보다 강력) |

### pnpm vs yarn
yarn은 한때 npm의 대안으로 주류였으나, 현재는 pnpm이 디스크 효율·strict dependency 측면에서 우위에 있다. yarn만의 결정적 장점(예: Plug'n'Play)은 이 프로젝트의 학습 목표(Next.js 심층 이해)와 직접 관련이 없다.

### pnpm vs bun
bun은 실험적 가치가 있고 속도 면에서 매력적이지만, **런타임까지 교체**하게 되면 검증해야 할 변수가 늘어난다. 이 프로젝트는 Next.js + Node 기반 생태계의 동작을 저수준에서 이해하는 것을 목표로 하므로, 런타임은 표준 Node로 유지하고 패키지 매니저만 pnpm으로 가져간다.

## 결과

### Pros
- **Phantom dependency 원천 차단** — 의존성 관계가 `package.json`에 선언된 대로 엄격히 반영됨. "어쩌다 돌아가던 코드"가 업데이트 후 원인 불명으로 깨지는 사고 방지.
- **디스크 사용량 절약** — 여러 학습 프로젝트를 병행하면 수십 GB 차이로 체감.
- **설치·cold install 속도 개선**.
- **학습 가치** — strict dependency 모델을 실제로 경험하면서 의존성 해석 과정에 대한 이해가 깊어짐.
- **Next.js 호환성** — Next.js 공식 문서에도 pnpm 예시가 다수 포함될 만큼 1급 지원.

### Cons
- 커맨드가 npm과 약간 다름 (`npm i X` → `pnpm add X`, `npm run` → `pnpm`, `npx` → `pnpm dlx`). 학습 곡선 있음.
- 드물게 오래된 패키지가 pnpm의 strict 구조에서 문제를 일으킬 수 있음. 필요 시 `.npmrc`의 `shamefully-hoist=true` 또는 `public-hoist-pattern[]`으로 부분 우회 가능.
- Docker 이미지 등 외부 도구가 npm을 전제하는 경우 이미지 설정에서 pnpm을 설치·사용하도록 조정 필요.

## 관련 설정

- 저장소 루트와 `develop/` 모두 pnpm 기반. `develop/`가 Next.js 앱 루트이며 `develop/package.json`, `develop/pnpm-lock.yaml`을 가진다.
- 빌드/테스트/린트 커맨드는 `develop/` 내부에서 실행한다. 상세는 `develop/CLAUDE.md`의 기술 스택 섹션 참조.

## References

- https://pnpm.io/motivation
- https://pnpm.io/feature-comparison
- https://pnpm.io/faq
