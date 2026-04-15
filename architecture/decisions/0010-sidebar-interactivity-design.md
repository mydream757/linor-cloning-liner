---
adr: 0010
title: 사이드바 인터랙티브 설계 (D4) — Radix DropdownMenu, HTML dialog, 중앙 editingId, pessimistic update
status: Accepted
date: 2026-04-15
---

# ADR-0010: 사이드바 인터랙티브 설계 (D4)

## Status

Accepted

## Context

기능 1의 Developer 단계 D4(`plan/features/1-app-shell.md` §8)는 **사이드바 Project 항목의 조작 인터랙션**을 완성하는 단계다. D3까지는 Project 목록이 읽기 전용 링크였지만, D4 이후에는:

- `⋯` 버튼 → 드롭다운 메뉴 → "이름 변경" / "삭제"
- 라벨 더블클릭 → 인라인 rename input
- "삭제" 클릭 → confirm 다이얼로그 → 실제 삭제
- 저장 중 스피너, 실패 시 인라인 에러

이 네 가지가 동시에 한 컴포넌트(`<ProjectItem />`) 위에서 작동해야 한다. 설계 결정 네 개를 묶어 기록한다.

1. **DropdownMenu**를 어떻게 구현하는가 (DIY vs 라이브러리)
2. **Confirm Dialog**를 어떻게 구현하는가 (DIY vs native vs 라이브러리)
3. **Rename 편집 상태**를 어디에 두는가 (개별 아이템 vs 중앙 집중)
4. **mutation 중 UI 업데이트 전략** — pessimistic vs optimistic

각 결정은 독립적이지만 모두 D4 안에서 동시에 적용되므로 하나의 ADR로 묶는다.

## Decision

### 1. DropdownMenu → **Radix `@radix-ui/react-dropdown-menu`**

`⋯` → "이름 변경" / "삭제" 드롭다운은 **Radix의 DropdownMenu primitive**로 구현한다. 번들은 primitive 단위 설치라 dropdown-menu와 그 transitive 의존(`react-menu`, `react-popper`, `react-focus-scope`, `react-dismissable-layer` 등)만 들어오며, 사용하지 않는 Radix primitive들(Dialog, Tooltip 등)은 설치되지 않는다.

### 2. Confirm Dialog → **HTML 네이티브 `<dialog>`**

삭제 확인 다이얼로그는 **HTML `<dialog>` 요소**로 구현한다. `ref`로 `showModal()`/`close()` 호출. focus trap·backdrop·ESC·inert 나머지 페이지가 네이티브로 처리된다. 추가 의존성 0.

### 3. Rename 편집 상태 → **중앙 집중 `editingId`**

`<Sidebar />` 또는 `<ProjectList />`(구현 시 결정, 관련 Client Component 쪽)가 `const [editingId, setEditingId] = useState<string | null>(null)`를 보유한다. 각 `<ProjectItem />`이 `editingId === project.id`로 자기 편집 여부를 확인한다.

### 4. mutation 중 UI 전략 → **Pessimistic** (useOptimistic 미사용)

`renameProject` · `deleteProject` Server Action 호출 중에는:

- rename: input을 유지한 채 우측 스피너 표시, 성공 시 원래 라벨로 복귀, 실패 시 인라인 에러
- delete: 다이얼로그의 "삭제" 버튼에 스피너, 성공 시 닫고 사이드바 갱신, 실패 시 다이얼로그 안 인라인 에러

React 19의 `useOptimistic`은 기능 3(Liner 뷰 SSE 스트리밍)에서 네트워크 지연이 실제로 크고 연속 mutation이 있을 때 도입한다.

## 고려한 대안

### 1. DropdownMenu

| 안 | 평가 |
|---|---|
| **A. 직접 구현 (`useState` open/close + outside click + ESC)** | a11y의 얕은 층(outside click, ESC)만 보이고 깊은 층(화살표 내비게이션, Home/End, typeahead 검색, `role="menu"` + `role="menuitem"`, roving tabindex, focus trap, focus 복귀)을 간과하기 쉽다. 정공법으로 DIY하려면 200줄+. 중간에 포기하면 "불완전한 a11y" 결과물만 남음 |
| **B. Radix `@radix-ui/react-dropdown-menu` (채택)** | 위 a11y 항목 전부가 기본 제공. 5줄로 사용. 번들 ~20KB gzipped(앱 전체의 <1%). Per-primitive 설치라 Radix의 다른 primitive들은 들어오지 않음 |
| C. Headless UI `Menu` | Radix보다 약간 가벼움(~10KB). 기능 충분. 하지만 이 프로젝트의 다른 primitive 후보(Tooltip, Popover 등)와의 생태계 정렬을 고려해 Radix가 더 장기적 선택 |

**DIY 기각 이유 (핵심)**: 이 프로젝트는 *"엣지 케이스·에러 상태를 정상 흐름만큼 중요하게 다룬다"*(develop/CLAUDE.md)와 *"학습 가치와 완성도는 트레이드오프가 아니다"*(CLAUDE.md 핵심 가치)를 원칙으로 박아두었다. 학습을 위해 a11y 완성도를 희생하는 것은 두 원칙 모두 위반이다. Radix로 품질을 확보하고, a11y 원리 학습은 별도 notes에서 보완하는 경로가 두 원칙을 동시에 만족시킨다.

### 2. Confirm Dialog

| 안 | 평가 |
|---|---|
| **A. HTML 네이티브 `<dialog>` (채택)** | focus trap·backdrop·ESC·inert 나머지 페이지가 네이티브로 처리됨. 0 의존성. 모던 브라우저 전부 지원. 학습 가치: `<dialog>`는 수년간 과소평가된 primitive라 정공법을 체험할 기회 |
| B. Radix `Dialog` | 동등한 a11y + 중첩 모달/scroll lock 같은 미세 엣지 케이스까지 커버. 번들 ~15KB. 이 프로젝트는 중첩 모달이 없고 단일 모달 scroll lock은 문제 없으므로 네이티브가 차지하는 80%가 아니라 95%가 커버됨 |
| C. 직접 `position: fixed` + 오버레이 | focus trap·ESC 수동 처리. a11y 구멍 많음. 기각 |

**DropdownMenu와 Dialog가 하이브리드인 이유**: 각 primitive의 "네이티브 a11y 성숙도"가 다르다. `<dialog>`는 네이티브가 거의 완성이고, 드롭다운 메뉴는 HTML `<menu>`로 대체 불가(의미론이 달라 메뉴 UX에 부적합). 따라서 **"네이티브가 충분하면 네이티브, 부족하면 검증된 라이브러리"**라는 일반 원칙을 이 프로젝트의 라이브러리 도입 기준으로 삼는다. 후속 결정(Tooltip, Popover, Accordion 등)이 생길 때도 이 원칙을 적용해 판단.

### 3. Rename 편집 상태 위치

| 안 | 평가 |
|---|---|
| A. 각 `<ProjectItem />`이 개별 `useState<boolean>`로 보유 | 가장 단순한 첫 인상. 하지만 "다른 항목을 편집하기 시작하면 이전 편집이 자동 취소" 같은 표준 UX를 만들려면 아이템 간 통신이 필요해져 복잡도가 폭발 |
| **B. 상위 컴포넌트가 `editingId: string \| null`로 중앙 집중 (채택)** | "동시에 한 항목만 편집 중"이 상태로 표현됨. 다른 항목 편집 시작 → 이전 자동 취소 = 공짜. 대부분의 앱에서 rename UX가 이 형태 |
| C. Context | 지금 단계에선 과함. `<Sidebar />`는 단일 위치이고 중간 props drilling 없음 |

**B 채택 이유**: 사용자 피드백에서 "일반적인 UX를 구현하는 것이 더 중요하다"로 방향 확정.

### 4. mutation 중 UI 전략

| 안 | 평가 |
|---|---|
| **A. Pessimistic — 스피너 + 대기 (채택)** | 예측 가능한 UX. 실패 시 상태가 이미 "시도 중"이므로 에러 메시지가 자연스럽게 맥락에 맞음. rename은 서버 왕복 <200ms라 낙관적 이득 미미 |
| B. Optimistic — 즉시 반영 + 실패 시 rollback | 사용자가 "바뀌었다"고 인식한 직후 rollback되면 혼란. 특히 **delete의 rollback**("삭제된 줄 알았는데 다시 나타남")은 다음 작업으로 이미 넘어간 사용자에게 더 큰 부정 체감. 학습 가치(`useOptimistic` API)는 기능 3 SSE에서 네트워크 지연이 실제로 클 때 도입하는 게 맥락에 맞음 |

**사용자 우려 반영**: 초안에서 "학습 가치 vs UX"로 제시했으나, 사용자 피드백("실패 시 rollback이 사용자 체감 불편이 크다")이 맞다. Pessimistic으로 확정.

## 결과

### Pros
- **a11y 품질 확보**: DropdownMenu의 복잡한 키보드·스크린 리더 경로가 Radix로 해결됨. Dialog는 네이티브가 대부분 해결
- **번들 영향 제한적**: Radix dropdown-menu만 ~20KB. Dialog는 0. 전체 앱 번들의 <1% 수준
- **학습 가치 보존**: HTML `<dialog>`의 정공법 체험 + "네이티브 a11y 성숙도 기반 라이브러리 도입 기준"이라는 일반 원칙 획득
- **일반적 UX**: 중앙 집중 editingId와 pessimistic update가 사용자 기대치와 정렬
- **원칙 일관성**: "서버에서 가능한 건 서버에서" + "엣지 케이스를 정상 흐름만큼" + "학습과 완성도는 트레이드오프 아님" 세 원칙을 모두 유지

### Cons
- **새 의존성 도입**: `@radix-ui/react-dropdown-menu`가 첫 UI primitive 라이브러리. 생태계 학습 비용 있음 (Radix가 다른 primitive까지 확장될 가능성)
- **두 방식 혼재**: DropdownMenu는 라이브러리, Dialog는 native. "일관성"의 관점에서 약간 복잡. 대안 원칙("네이티브 성숙도" 기반)을 문서화해 완화
- **Pessimistic의 체감 미세 지연**: rename 저장 중 200ms 스피너가 보임. 실사용에서 너무 느리게 체감되면 후속 ADR로 `useOptimistic` 재검토
- **Radix 커스터마이즈 학습 필요**: Unstyled primitives라 스타일은 우리 몫이고, `data-state="open"` 같은 속성 셀렉터를 Tailwind에서 써야 함. 초회에 익숙지 않을 수 있음

## 연관 결정

- `plan/features/1-app-shell.md` §8 (D-stages) — 이 ADR의 의사결정이 적용될 D4 단계의 정의
- [ADR-0008: Server Action 패턴](0008-server-action-pattern.md) — rename/delete action의 `ActionResult<T>` shape이 이 ADR의 에러 표시 방식의 전제
- [ADR-0009: Revalidation 전략](0009-revalidation-strategy.md) — mutation 이후 사이드바 재렌더는 Phase 1 `revalidatePath`로 해결
- `develop/CLAUDE.md`의 "서버/클라이언트 경계 (핵심 원칙)" — `<ProjectItem />`을 client로 승격할 때 "최소 단위만" 원칙 준수. 개별 행만 클라, `<ProjectList />`(fetch/map)는 서버 유지

## References

- Radix UI Primitives: https://www.radix-ui.com/primitives/docs/components/dropdown-menu
- MDN HTMLDialogElement: https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement
- React 19 `useOptimistic`: https://react.dev/reference/react/useOptimistic
