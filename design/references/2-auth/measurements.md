---
feature: 인증 (NextAuth) + 데이터 소유권
version: 0.2
last_updated: 2026-04-16
source: 라이너 원본 서비스 (liner.com / scholar.liner.com)
captured_at: 2026-04-16
---

# 디자인 레퍼런스 — 기능 2 (인증)

이 문서는 기능 2의 **기능 고유** 디자인 실측값만 담는다. 색·폰트·radius 같은 재사용 토큰은 이 파일에 두지 말고 `../../design-tokens.md`에 정의한 뒤 이 파일에서는 **이름으로 참조**한다.

확신 없는 값은 빈칸 또는 `(미확인)`으로 둔다. 추측값이 굳지 않도록 주의.

**출처 범례**: `devtools` / `추정` / `카탈로그` / `결정`

## 스크린샷 인덱스

| # | 파일 | 상태 | 주요 포인팅 요소 |
|---|---|---|---|
| 01a | screenshots/01-login-page-initial.jpeg | 로그인 초기 화면 (카카오 + "다른 방법으로 계속하기" + 이메일) | ①로고·서비스명 / ②카카오 버튼 / ③"다른 방법으로 계속하기" 버튼 / ④이메일 입력 필드 / ⑤하단 약관 |
| 01b | screenshots/01-login-page-providers.jpeg | 프로바이더 전체 목록 ("다른 방법" 펼침) | ①카카오 / ②구글 / ③페이스북 / ④Apple / ⑤레노버 / ⑥이메일로 계속하기 |
| 02 | screenshots/02-sidebar-profile.jpeg | 로그인 후 사이드바 하단 프로필 영역 | ①친구 초대 배너 / ②프로필 버튼 (아바타+이름+Free 배지) / ③앱 다운로드 / ④상단 구분선 |
| 03 | screenshots/03-profile-menu.jpeg | 프로필 클릭 시 메뉴 (인라인 expand) | ①이메일 / ②개인 설정 / ③테마 / ④업그레이드 / ⑤로그아웃 / ⑥스페이스 변경 / ⑦팀 플랜 시작하기 |

---

## 레이아웃 치수

### 로그인 페이지

| 속성 | 값 | 출처 |
|---|---|---|
| 페이지 배경색 | `#1e1e1f` (rgb 30,30,31) | devtools |
| 컨텐츠 컨테이너 폭 | **480px** | devtools |
| 컨텐츠 컨테이너 정렬 | 수평 가운데 (flex center) | devtools |
| 컨테이너 배경색 | `#1e1e1f` | devtools |
| 컨테이너 border-radius | **20px** | devtools |
| 컨테이너 padding | **40px** (전방향 균일) | devtools |
| 로고 SVG 크기 | **36×36px** | devtools |
| 로고 → 안내 문구 간격 | **12px** | 계산 |
| 로고+제목 섹션 → 버튼 영역 간격 | **25px** | 계산 |
| 안내 문구 font-size | **24px** | devtools |
| 안내 문구 font-weight | **600** | devtools |
| 안내 문구 color | `#ffffff` | devtools |
| 프로바이더 버튼 폭 | **398px** | devtools |
| 프로바이더 버튼 높이 | **48px** | devtools |
| 프로바이더 버튼 border-radius | **10px** | devtools |
| 프로바이더 버튼 간 간격 | **8px** (일반) / **20px** (이메일 버튼 전) | devtools |
| 카카오 버튼 bg | `#FEE500` (rgb 254,229,0) | devtools |
| 카카오 버튼 color | black | devtools |
| 카카오 버튼 border | 없음 | devtools |
| 구글/FB/Apple/레노버 버튼 bg | `rgb(39,39,41)` | devtools |
| 프로바이더 버튼 border | `1px solid rgba(233,233,235,0.28)` | devtools |
| 이메일로 계속하기 버튼 bg | `#ffffff` | devtools |
| 이메일로 계속하기 버튼 color | `#1e1e1f` | devtools |
| 프로바이더 아이콘 크기 | **24×24px** | devtools |
| 아이콘 위치 | `absolute, left: 12px` (버튼 기준) | devtools |
| 버튼 텍스트 정렬 | 버튼 내 가운데 | devtools |
| 버튼 텍스트 font-size | **16px** | devtools |
| 버튼 텍스트 font-weight | **600** | devtools |
| 이메일 필드 높이 (래퍼) | **60px** | devtools |
| 이메일 필드 border | `outline: 1px solid rgb(88,89,92)` | devtools |
| 이메일 필드 border-radius | **10px** | devtools |
| 이메일 필드 bg | `#1e1e1f` | devtools |
| 하단 약관 텍스트 font-size | **10px** | devtools |
| 하단 약관 텍스트 color | `rgba(233,233,235,0.64)` | devtools |

### 사이드바 프로필 영역

| 속성 | 값 | 출처 |
|---|---|---|
| 사이드바 폭 | **260px** | devtools |
| 사이드바 배경색 | `rgb(39,39,41)` = `#272729` | devtools |
| 하단 고정 섹션 전체 높이 | **155px** (친구초대 배너 + 프로필 버튼 + 앱 다운로드 포함) | devtools |
| 하단 섹션 배경색 | `rgb(39,39,41)` | devtools |
| 상단 구분선 | `1px solid rgb(57,57,59)` = `border-top` | devtools |
| 하단 섹션 padding | **8px** (전방향) | devtools |
| 프로필 버튼 높이 | **32px** (h-8) | devtools |
| 프로필 버튼 폭 | **244px** | devtools |
| 프로필 버튼 padding | `8px 4px` (상하 8, 좌우 4) | devtools |
| 프로필 버튼 내부 gap | **8px** | devtools |
| 프로필 버튼 hover bg | `bg-neutral-fill-overlay-lowest-hover` 토큰 | devtools |
| 아바타 컨테이너 크기 | **24×24px** | devtools |
| 아바타 이미지 크기 | **22×22px** | devtools |
| 아바타 border-radius | `200px` (완전 원형) | devtools |
| 아바타 → 텍스트 간격 | **8px** (gap) | 계산 |
| 이름 텍스트 font-size | **13px** | devtools |
| 이름 텍스트 font-weight | **350** | devtools |
| 이름 텍스트 color | `#ffffff` | devtools |
| 플랜 배지("Free") 크기 | **32×20px** | devtools |
| 플랜 배지 border-radius | **6px** | devtools |
| 플랜 배지 padding | `2px 4px` | devtools |
| 플랜 텍스트 font-size | **11px** | devtools |
| 플랜 텍스트 color | `rgba(233,233,235,0.64)` | devtools |

### 프로필 메뉴

| 속성 | 값 | 출처 |
|---|---|---|
| 메뉴 폭 | **236px** | devtools |
| 메뉴 높이 | **303px** | devtools |
| 메뉴 배경색 | `#1e1e1f` (bg-neutral-container-lowest) | devtools |
| 메뉴 border | 없음 (0px) | devtools |
| 메뉴 shadow | `shadow-normal` 토큰 (실제값 투명) | devtools |
| 메뉴 border-radius | **8px** | devtools |
| 메뉴 항목 높이 | **32px** (h-8) | devtools |
| 메뉴 항목 padding | `0px 4px 0px 8px` (우 4, 좌 8) | devtools |
| 메뉴 항목 font-size | **13px** (p 요소) | devtools |
| 메뉴 항목 color | `#ffffff` | devtools |
| 메뉴 항목 hover bg | `bg-neutral-fill-overlay-lowest-hover` 토큰 | devtools |
| 이메일 행 font-size | **12px** | devtools |
| 이메일 행 color | `rgba(233,233,235,0.64)` | devtools |
| 메뉴 항목 border-radius | **6px** | devtools |
| 그룹 구분선 | 있음 (`bg-neutral-border-overlay-normal`, 1px, `rgba(233,233,235,0.28)`) | devtools |
| 항목 순서 | 이메일 → 개인 설정 → 테마 → 업그레이드 → 로그아웃 | devtools |
| 로그아웃 위치 | 첫 번째 섹션의 **5번째 항목** | devtools |
| 로그아웃 텍스트 색 | 다른 항목과 동일 (`#ffffff`, 차별화 없음) | devtools |

---

## 사용하는 전역 토큰

이 표는 기능 2가 참조할 전역 토큰 이름만 나열한다. **값은 [`../../design-tokens.md`](../../design-tokens.md)의 단일 진실 소스를 따른다.**

| 요소 | 속성 | 전역 토큰 | 비고 (신규 여부) |
|---|---|---|---|
| 로그인 페이지 배경 | background | `color-bg-primary` | 기존 (`#1e1e1f` 일치) |
| 프로바이더 버튼 배경 (일반) | background | `color-bg-secondary` | 기존 (`#272729` ≈ `rgb(39,39,41)` 일치) |
| 프로바이더 버튼 border | border | — | `rgba(233,233,235,0.28)` — 기존 `color-border-subtle`(`rgba(233,233,235,0.20)`)과 유사하나 불투명도 차이. 신규 토큰 필요 여부 결정 필요 |
| 안내 문구 | color | `color-text-primary` | 기존 (`#ffffff` 일치) |
| 하단 약관·이메일 행 | color | `color-text-secondary` | 기존 (`rgba(233,233,235,0.64)` 일치) |
| 프로필 이름 | color | `color-text-primary` | 기존 |
| 프로필 영역 배경 | background | `color-bg-secondary` | 기존 (사이드바 배경과 동일) |
| 프로필 영역 상단 구분선 | border-top | `color-border-default` | 기존 (`#39393B` ≈ `rgb(57,57,59)` 일치) |
| 프로필 버튼 hover | background | `color-bg-hover` | 기존 |
| 프로필 메뉴 배경 | background | `color-bg-primary` | 기존 (`#1e1e1f` 일치) |
| 프로필 메뉴 항목 hover | background | `color-bg-hover` | 기존 |
| 프로필 메뉴 구분선 | border | — | `rgba(233,233,235,0.28)` — 프로바이더 버튼 border와 동일값. 신규 토큰 후보 |
| 프로필 메뉴 radius | border-radius | `radius-md` | 기존 (8px 일치) |
| 프로바이더 버튼 radius | border-radius | `radius-lg` | 기존 (10px 일치) |
| 프로필 아바타 간격 | gap | `space-sm` | 기존 (8px 일치) |
| 하단 섹션 padding | padding | `space-sm` | 기존 (8px 일치) |
| 프로필 버튼 높이 | height | — | 32px, 기능 고유 치수 |
| 로그인 컨테이너 padding | padding | — | 40px, 기능 고유 치수 (기존 스케일에 없음) |
| 로그인 컨테이너 radius | border-radius | — | 20px, 기능 고유 치수 (기존 `radius-lg`=10px보다 큼. 신규 토큰 후보: `radius-xl`) |

---

## 인터랙션 노트

| 항목 | 확인된 내용 |
|---|---|
| 로그인 버튼 클릭 동작 | **팝업(window.open) 방식** — Google GIS OAuth, storagerelay 프로토콜 |
| 미인증 시 보호 경로 접근 | **모달 오버레이** 방식 (전체 페이지 redirect 아님) |
| 프로필 영역 클릭 동작 | **드롭다운 메뉴** (인라인 expand, 사이드바 내에서 위쪽으로 올라오는 형태) |
| 로그아웃 클릭 동작 | (미확인 — confirm 여부) |

---

## 열린 관찰

- **로그인 페이지 2단계 구조**: 원본은 카카오 + "다른 방법으로 계속하기" 접힘 구조로, 주요 프로바이더(카카오)를 강조하고 나머지를 숨긴다. 우리는 Google 단일이라 이 접힘 패턴이 불필요 — 단순화 필요.
- **프로바이더 버튼 border 색 `rgba(233,233,235,0.28)`**: 기존 `color-border-subtle`(0.20)보다 약간 불투명. 프로필 메뉴 구분선도 동일 값. 신규 전역 토큰(`color-border-normal`?)으로 등록할지 결정 필요.
- **로그인 컨테이너 padding 40px, radius 20px**: 기존 토큰 스케일에 없는 값. 로그인 페이지 전용 치수로 둘지, `space-xxl`/`radius-xl`로 전역화할지 결정 필요.
- **사이드바 하단 고정 영역**: 친구초대 배너 + 프로필 + 앱 다운로드 3요소 구성. 우리는 친구초대/앱 다운로드가 비-스코프이므로 프로필 버튼만 남게 됨. 하단 영역 높이가 대폭 줄어듦.
- **프로필 메뉴가 사이드바 내 인라인 expand**: 별도 팝오버가 아니라 사이드바 하단에서 위로 올라오는 형태. Radix DropdownMenu보다는 사이드바 내부의 토글 expand가 원본에 가까움.
- **플랜 배지("Free")**: 우리 MVP에는 플랜 구분이 없으므로 제외 대상.

---

## Changelog

- 0.2 (2026-04-16): DevTools 실측 완료. 스크린샷 4종(로그인 초기/프로바이더 목록/사이드바 프로필/프로필 메뉴) 촬영. 로그인 페이지(컨테이너 480px/padding 40px/radius 20px, 버튼 398×48px/radius 10px), 사이드바 프로필(버튼 32px/아바타 24px/이름 13px), 프로필 메뉴(236×303px/radius 8px/항목 32px) 실측. 전역 토큰 매핑 및 신규 후보 3건 식별. 인터랙션 노트 4항목 확인.
- 0.1 (2026-04-16): 템플릿 생성. 스크린샷 인덱스 3종, 빈 테이블 정의.
