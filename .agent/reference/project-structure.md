# 프로젝트 구조

> **목적**: Ghostwriter의 디렉토리 구조와 각 모듈의 역할을 설명합니다.

**마지막 업데이트**: 2026-02-21

---

## 📁 디렉토리 구조

```
Ghostwriter/
├── index.html                  # 메인 HTML
├── style.css                   # 스타일
├── secrets.js                  # 환경 변수 (gitignore)
├── .agent/                     # 🤖 AI 개발 가이드 & 기술 레퍼런스
│   ├── README.md               # AI 세션 시작점 (스마트 라우터)
│   ├── principles/             # 설계 원칙 & 코딩 컨벤션
│   ├── reference/              # 기술 레퍼런스 (이 파일 포함)
│   ├── guides/                 # How-to 가이드
│   └── workflows/              # 자동화 워크플로우
├── .ideas/                     # 💡 기획 & 방향성 (gitignore)
│   ├── features.md             # 기능 목록
│   ├── roadmap.md              # 개발 로드맵
│   ├── current-status.md       # 현재 진행 상태
│   └── technical-dependencies.md # 기술 의존성
├── docs/                       # 📚 외부 소개용 문서
│   └── README.md               # 프로젝트 소개 1페이지
└── src/
    ├── boot.js                 # 애플리케이션 진입점
    ├── config.js               # 설정 상수
    ├── auth/                   # 인증
    ├── drive/                  # Drive API
    ├── initialization/         # 초기화 (계획 중)
    ├── llm/                    # LLM 통합
    ├── memory/                 # 스토리지
    ├── persona/                # 캐릭터
    ├── ui/                     # UI 컨트롤러
    ├── models/                 # 타입 정의
    └── utils/                  # 유틸리티
```

---

## 📖 모듈별 설명

### `src/boot.js`

**역할**: 애플리케이션 진입점

- DOM 로드 후 실행
- UI 초기화
- 캐릭터 리스트 초기화
- 세션 툴바 초기화
- 페르소나 UI 초기화
- 인증 시스템 초기화  
- DevTools 로드

### `src/auth/`

**역할**: Google 인증 관리

| 파일 | 역할 |
|------|------|
| `auth.service.js` | OAuth 2.0 로그인/로그아웃, 토큰 관리 |

**주요 함수**:
- `initAuth()`: 인증 시스템 초기화
- `signIn()`: 로그인
- `signOut()`: 로그아웃

### `src/drive/`

**역할**: Google Drive API 래퍼

| 파일 | 역할 |
|------|------|
| `drive.service.js` | Drive 파일/폴더 CRUD, 순수 API 래퍼 |

**주요 함수**:
- `createWorkspace()`: Ghostwriter_Data 폴더 생성
- `readStatusFile()`: status.json 읽기
- `updateSettings()`: 설정 저장

### `src/initialization/` (계획 중)

**역할**: 로그인 후 초기화 로직

| 파일 | 역할 |
|------|------|
| `initialization.orchestrator.js` | 초기화 흐름 제어 |
| `workspace.initializer.js` | 폴더 구조 생성 |
| `settings.initializer.js` | 설정 로드 |

상세 내용: [initialization.md](./initialization.md)

### `src/llm/`

**역할**: LLM 통합 (다중 프로바이더)

| 파일 | 역할 |
|------|------|
| `llm.service.js` | LLM 서비스 통합 관리 (프로바이더 전환, 이벤트) |
| `providers/base-provider.js` | Provider 기본 클래스 (인터페이스 정의) |
| `providers/gemini.provider.js` | Google Gemini 구현 |
| `providers/openai.provider.js` | OpenAI Chat Completions 구현 (호환 API 지원) |
| `providers/claude.provider.js` | Anthropic Claude Messages 구현 |

### `src/memory/`

**역할**: 데이터 저장 관리

| 파일 | 역할 |
|------|------|
| `storage.manager.js` | Drive 파일 CRUD, 폴더 관리 |
| `chat.repository.js` | 채팅 세션 저장/로드/리스트/삭제 |

### `src/persona/`

**역할**: 캐릭터 및 유저 페르소나 관리

| 파일 | 역할 |
|------|------|
| `character.service.js` | 캐릭터 CRUD + Drive 연동, 샘플 캐릭터 보호 |
| `persona.service.js` | 유저 페르소나 CRUD + Drive 연동, 기본 페르소나 보호 |

### `src/ui/`

**역할**: UI 컨트롤러

| 파일 | 역할 |
|------|------|
| `ui.controller.js` | UI 상태 관리 (로그인/로그아웃 UI 전환) |
| `chat.controller.js` | 채팅 UI 컨트롤, 페르소나 프롬프트 주입 |
| `character.controller.js` | 캐릭터 사이드바 + CRUD 모달 |
| `persona.controller.js` | 페르소나 탭 UI + CRUD + 자동 저장 |
| `session.controller.js` | 세션 드롭다운 + 캐릭터별 세션 전환 |
| `settings.controller.js` | 설정 모달 관리 (탭 방식: 설정/페르소나) |
| `devtools.js` | 개발자 도구 |

### `src/utils/`

**역할**: 유틸리티

| 파일 | 역할 |
|------|------|
| `logger.js` | 인웹 로그 출력 |

---

## 🎯 네이밍 컨벤션

전체 컨벤션: [coding-conventions.md](../principles/coding-conventions.md)

| 타입 | 컨벤션 | 예시 |
|------|--------|------|
| 파일명 | `kebab-case.js` | `auth.service.js` |
| 디렉토리명 | `kebab-case` | `llm/`, `memory/` |
| 클래스명 | `PascalCase` | `InitializationOrchestrator` |
| 함수/변수 | `camelCase` | `getUserSettings()` |
| 상수 | `UPPER_SNAKE_CASE` | `FOLDER_NAME` |

---

## 📚 관련 문서

- [데이터 흐름](./data-flow.md) - Drive 폴더 구조
- [코딩 컨벤션](../principles/coding-conventions.md) - 상세 스타일 가이드
