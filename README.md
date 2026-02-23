# Ghostwriter

> 서버리스 AI 롤플레이 및 소설 작성 클라이언트

---

## 📋 Ghostwriter란?

**Ghostwriter**는 Google Drive 기반의 서버리스 AI 롤플레이 및 소설 작성 클라이언트입니다.

### 핵심 특징

- **서버리스** — 서버 비용 $0. 모든 데이터는 사용자의 Google Drive에 저장
- **데이터 소유권** — 개발자도 사용자 데이터에 접근 불가
- **멀티 플랫폼** — 웹 브라우저만 있으면 어디서든 사용 가능
- **동기화** — Google Drive를 통해 모든 기기에서 설정/데이터 동기화

---

## 🚀 사용하기

👉 **[Ghostwriter 바로가기](https://hibikukane.github.io/Ghostwriter/)**

Google 계정으로 로그인하면 바로 사용할 수 있습니다. 별도 설치 불필요.

<details>
<summary>🔧 로컬 개발 환경 세팅</summary>

1. 레포 클론
2. `secrets.js`에 Google OAuth Client ID 설정
3. 로컬 서버 실행: `python -m http.server 5500`
4. `http://localhost:5500` 접속
</details>

---

## 🎨 주요 기능

| 기능 | 상태 |
|------|------|
| Google 인증 (OAuth 2.0) | ✅ |
| LLM 통합 (다중 프로바이더) | ✅ |
| 캐릭터 관리 (CRUD + Drive 연동) | ✅ |
| 세션 관리 (저장/불러오기/전환) | ✅ |
| 설정 관리 (Drive 저장/로드) | ✅ |
| 유저 페르소나 관리 | ✅ |
| 고급 대화 모드 (롤플레이/소설) | 🔜 |

### 지원 LLM 프로바이더

| 프로바이더 | 설명 |
|------|------|
| Google Gemini | Gemini 1.5 Flash/Pro 등 |
| OpenAI | GPT-4o, GPT-4o-mini 등 (호환 API 포함) |
| Anthropic Claude | Claude Sonnet/Haiku/Opus |
| 커스텀 | 자체 URL + 모델명 지정 (로컬 모델, 호환 API 등) |

---

## 📊 기술 스택

| 분야 | 기술 |
|------|------|
| Frontend | Vanilla JS (ES6+) |
| Styling | Vanilla CSS |
| Storage | Google Drive API |
| LLM | Gemini, OpenAI, Claude, Custom |
| Auth | Google OAuth 2.0 |
| Hosting | GitHub Pages |

---

## 🏗️ 프로젝트 구조

```
Ghostwriter/
├── index.html              # 메인 HTML
├── style.css               # 스타일
├── src/                    # 소스 코드
│   ├── auth/               # 인증
│   ├── drive/              # Google Drive API
│   ├── llm/                # LLM 통합 (다중 프로바이더)
│   │   └── providers/      # Gemini, OpenAI, Claude, Custom
│   ├── memory/             # 스토리지 관리
│   ├── persona/            # 유저 페르소나 관리
│   ├── ui/                 # UI 컨트롤러
│   └── utils/              # 유틸리티
├── .agent/                 # AI 개발 가이드 (개발자용)
└── docs/                   # 기능 설명 문서
```

---

## 🔒 보안 & 프라이버시

- ✅ 모든 데이터는 **사용자의 Drive**에만 저장
- ✅ `drive.file` 스코프만 사용 (앱이 생성한 파일만 접근)
- ✅ 서버를 거치지 않음

---

## 📄 라이선스

MIT? (예정)
