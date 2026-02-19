# Ghostwriter — AI 에이전트 가이드

> **목적**: 새 세션 시작 시 이 파일을 먼저 읽으세요.

**마지막 업데이트**: 2026-02-19

---

## 📋 프로젝트 한 줄 요약

Google Drive 기반 서버리스 AI 롤플레이/소설 작성 클라이언트.
Vanilla JS (ES6+), 4칸 들여쓰기, 작은따옴표, 세미콜론 사용.

---

## 🧭 컨텍스트 로딩 — 작업 유형별 읽을 문서

| 작업 유형 | 필수 문서 | 선택 문서 |
|-----------|----------|----------|
| **새 기능 개발** | `principles/design-principles.md` | `reference/project-structure.md`, `guides/adding-features.md` |
| **기존 기능 수정** | `reference/project-structure.md` | `reference/tech-debt.md` |
| **기획/방향 논의** | `.ideas/current-status.md`, `.ideas/roadmap.md` | `.ideas/features.md`, `.ideas/technical-dependencies.md` |
| **버그 수정** | `reference/tech-debt.md` | 해당 모듈 코드 직접 확인 |
| **전체 리뷰** | `.ideas/current-status.md` | `.ideas/` 전체, `reference/` 전체 |
| **캐릭터/세션 작업** | `reference/project-structure.md` | `guides/adding-features.md` |
| **초기화 관련** | `reference/initialization.md` | `principles/design-principles.md` |

> **TIP**: 모든 문서를 항상 읽을 필요 없음. 작업에 맞는 문서만 골라서.

---

## 📂 문서 구조

```
.agent/                          ← 지금 여기
├── README.md                    # 이 파일 (세션 시작점)
├── principles/                  # 🎯 설계 원칙 & 코딩 가이드
│   ├── design-principles.md     #   투명성, 단일 책임, 멱등성, 확장성
│   └── coding-conventions.md    #   네이밍, 로깅, 코드 스타일
├── reference/                   # 📖 기술 레퍼런스
│   ├── project-structure.md     #   디렉토리 & 모듈별 설명
│   ├── data-flow.md             #   Drive 폴더 구조, JSON 스키마
│   ├── tech-debt.md             #   알려진 이슈 추적
│   └── initialization.md        #   초기화 아키텍처 설계
├── guides/                      # 🔧 How-to 가이드
│   ├── adding-features.md       #   새 기능 추가 체크리스트
│   └── getting-started.md       #   세션 시작 상세 가이드
└── workflows/                   # ⚡ 자동화 워크플로우

.ideas/                          ← 기획 & 방향성 (gitignore)
├── features.md                  #   13가지 기능 목록
├── roadmap.md                   #   Phase별 로드맵
├── current-status.md            #   현재 진행률 ~ 80%
└── technical-dependencies.md    #   기능 간 의존성 그래프

docs/                            ← 외부 소개용 (최소)
└── README.md                    #   프로젝트 1페이지 소개
```

---

## ⚠️ 핵심 원칙 (빠른 참조)

1. **투명성** — 드라이브 작업은 반드시 `log()` 로 인웹 표시
2. **단일 책임** — 모듈 하나 = 책임 하나
3. **멱등성** — `findOrCreate` 패턴, 중복 실행 안전
4. **확장성** — Phase 기반 플러그인, Provider 패턴

---

## 🚫 절대 하지 말 것

- ❌ 설계 원칙 무시
- ❌ 드라이브 로그 생략
- ❌ 민감 정보(API 키 등) 로그 출력
- ❌ default export 사용
- ❌ 한 파일에 너무 많은 로직
