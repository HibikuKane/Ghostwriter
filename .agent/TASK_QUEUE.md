# TASK_QUEUE — 자율 개발 루프 태스크 큐

> 오케스트레이터가 이 파일을 읽고 다음 태스크를 선택한다.  
> 태스크 완료 / 블로킹 발생 시 즉시 업데이트.

---

## 상태 범례

| 상태 | 의미 |
|------|------|
| `READY` | 즉시 시작 가능 |
| `IN_PROGRESS` | 현재 작업 중 |
| `BLOCKED` | 의존성 미충족 또는 3회 테스트 실패 |
| `WAITING_PR` | PR 생성 완료, 유저 머지 대기 |
| `DONE` | 완료 |

---

## Phase 0 — 인프라 기반

| ID | 태스크 | 상태 | 의존성 | 브랜치 |
|----|--------|------|--------|--------|
| P0-1 | Playwright E2E 세팅 | `DONE` | — | `release/playwright-setup` |

---

## Phase 2 — 캐릭터 시스템 확장

| ID | 태스크 | 상태 | 의존성 | 브랜치 |
|----|--------|------|--------|--------|
| P2-1 | 캐릭터 에셋 관리 (#2) | `DONE` | — | `release/character-assets` |
| P2-2 | 모델 세부 설정 (#3) | `DONE` | — | `release/model-params` |
| P2-3 | 인앱 가이드 시스템 | `DONE` | — | `release/in-app-guide` |

---

## Phase 3 — 고급 대화 모드 & 프롬프트 제어

| ID | 태스크 | 상태 | 의존성 | 브랜치 |
|----|--------|------|--------|--------|
| P3-1 | 롤플레잉 모드 (#1.2) | `DONE` | P2-1 ✅ | `release/roleplay-mode` |
| P3-2 | 프롬프트 제어 UI (#4) | `DONE` | P3-1 ✅, P2-1 ✅ | `release/prompt-control` |
| P3-3 | 프리셋 시스템 (#10) | `WAITING_PR` | P3-2 ✅ | `release/preset-system` |
| P3-4 | 소설가 모드 (#1.3) | `WAITING_PR` | P3-1 ✅ | `release/novelist-mode` |
| P3-5 | 프롬프트 인스펙터 (#13) | `WAITING_PR` | P3-2 ✅ | `release/prompt-inspector` |
| P3-6 | 채팅 기록 편집 | `WAITING_PR` | — | `release/chat-history-edit` |

---

## Phase 4 — 다언어 & UX 개선

| ID | 태스크 | 상태 | 의존성 | 브랜치 |
|----|--------|------|--------|--------|
| P4-1 | 다국어 UI (#5) — 언어팩 시스템 (ko/en/ja) | `WAITING_PR` | Phase 3 | `release/i18n-multilang` |

---

## 블로킹 로그

_없음_

---

## 완료 로그

| 완료일 | ID | 태스크 | PR |
|--------|----|--------|----|
| 2026-04-05 | HARNESS | Phase Harness 설정 | — |
| 2026-04-05 | P0-1 | Playwright E2E 세팅 | #20 |
| 2026-04-05 | P2-1 | 캐릭터 에셋 관리 | #21 |
| 2026-04-05 | P2-2 | 모델 세부 설정 | #22 |
| 2026-04-05 | P2-3 | 인앱 가이드 시스템 | #23 |
| 2026-04-05 | P3-1 | 롤플레잉 모드 | #24 |
| 2026-04-05 | P3-2 | 프롬프트 제어 UI | #25 |
| 2026-04-05 | P3-3 | 프리셋 시스템 | #27 (WAITING_PR) |
| 2026-04-05 | P3-4 | 소설가 모드 | #28 (WAITING_PR) |
| 2026-04-05 | P3-5 | 프롬프트 인스펙터 | #29 (WAITING_PR) |
| 2026-04-05 | P3-6 | 채팅 기록 편집 | #30 (WAITING_PR) |
| 2026-04-05 | P4-1 | 다국어 UI | #31 (WAITING_PR) |
