---
adr: 0002
title: PostgreSQL을 Docker Compose로 구동
status: Accepted
date: 2026-04-14
---

# ADR-0002: PostgreSQL을 Docker Compose로 구동

## Status

Accepted

## Context

이 프로젝트는 로컬 DB로 PostgreSQL을 사용한다. Prisma와 NextAuth가 PostgreSQL 기반으로 설정될 예정이다. PostgreSQL을 어떻게 구동할지 결정이 필요하다.

대안:
1. **호스트에 직접 설치** — Homebrew/공식 설치 프로그램 등으로 macOS/Linux에 PostgreSQL을 설치
2. **Docker Compose 기반 컨테이너** — 리포지토리의 `docker-compose.yml`에 PostgreSQL 서비스를 정의하고 기동
3. **관리형 서비스** (Supabase, Neon 등) — 이 프로젝트는 "로컬 개발 전용" 단계이므로 범위 밖

## Decision

**Docker Compose 기반 PostgreSQL 컨테이너**로 구동한다.

`develop/docker-compose.yml`에 PostgreSQL 서비스를 정의하고, `develop/` 디렉터리에서 `docker compose up -d`로 기동한다.

## 고려한 대안

### 호스트 설치 vs Docker 컨테이너

| 축 | 호스트 설치 | Docker Compose |
|---|---|---|
| 환경 의존성 | 호스트 OS·버전·패키지 매니저에 결합 | 이미지에 버전 고정 |
| 재현성 | 설치 절차·버전 맞춤을 문서화해야 함 | `docker-compose.yml` 하나로 동일한 환경 재현 |
| 격리 | 호스트 프로세스로 동작. 다른 프로젝트의 PostgreSQL과 충돌 가능 | 컨테이너로 격리 |
| 제거·리셋 | 수동, 초기 상태 복구가 번거로움 | `docker compose down -v` 한 줄로 볼륨까지 삭제 |
| 업그레이드 | 수동, 데이터 마이그레이션 주의 | 이미지 태그만 교체 |
| 포트 충돌 | 호스트 포트 5432 점유 | 호스트 포트 매핑을 자유롭게 조정 가능 |
| 성능 | 약간 더 빠름 (특히 macOS의 파일 IO) | 실용적으로 충분 (개발 용도) |
| 오버헤드 | 없음 | Docker Desktop/Colima 등 런타임 필요 |

## 결과

### Pros
- **환경 의존성 없는 재현 가능한 로컬 실행.** 사용자가 `docker compose up -d` 한 번으로 동일한 DB 환경을 즉시 얻는다. PostgreSQL 버전·초기화 설정·기본 DB/사용자가 모두 이미지와 compose 파일에 고정된다.
- **호스트 오염 없음.** 실험 후 `docker compose down -v`로 깔끔히 리셋 가능.
- **확장 용이성.** 나중에 Redis, MinIO, 외부 LLM 프록시 같은 부가 서비스를 `docker-compose.yml`에 추가하기 쉽다.
- **이식성.** CI나 다른 개발 환경으로 옮길 때 별도 설치 절차 문서가 필요 없다.
- **"학습용 편의"라는 부가 효과.** 로컬에 PostgreSQL을 직접 설치하지 않아도 됨.

### Cons
- **Docker 런타임 의존성.** Docker Desktop 또는 Colima 같은 런타임이 설치되어 있어야 한다. (1인 학습 프로젝트에서 수용 가능한 전제)
- **약간의 오버헤드.** 특히 macOS에서 컨테이너 파일시스템 IO가 호스트 네이티브보다 느릴 수 있다. 이 프로젝트의 워크로드(학습·개발 수준)에서는 체감되지 않는 수준.
- **디버깅 경로 추가.** 로그는 `docker logs`, DB 접속은 `docker exec` 또는 호스트에서 `psql` 로 포트 매핑을 통해 접근해야 한다.

## 구성

- **이미지**: `postgres:16-alpine` — 최신 안정 메이저, 경량 이미지
- **포트**: 호스트 `5432` → 컨테이너 `5432`
- **볼륨**: named volume으로 데이터 영속화 (`docker compose down`만으로는 데이터 유지, `down -v`로 완전 삭제)
- **기본 DB/사용자/비밀번호**: 환경변수로 지정하며, 개발용 기본값은 `docker-compose.yml`에 평문으로 둔다. 프로덕션 배포 시에는 이 ADR을 갱신할 것.

상세 설정은 `develop/docker-compose.yml` 참조. 이 위치는 루트 배치 원칙(루트에는 AI 오케스트레이션 컨텍스트와 범용 git 설정만 둠)에 따라 컨테이너를 소비하는 역할 디렉터리(`develop/`) 하위로 배치한 결과다.

## 연관 결정

- Prisma의 `DATABASE_URL`은 `develop/.env.local`에 정의하며, 기본값은 `postgresql://linor:linor_dev@localhost:5432/linor_cloning_liner` 형태다.
- 향후 프로덕션 배포가 의사결정 범위에 들어오면 관리형 PostgreSQL(예: Neon, Supabase)로의 전환을 새 ADR로 논의한다.

## References

- https://hub.docker.com/_/postgres
- https://docs.docker.com/compose/
