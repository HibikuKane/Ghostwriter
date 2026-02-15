# Ghostwriter

서버리스 AI 롤플레이 및 소설 작성 클라이언트

## 🚀 빠른 시작

1. `secrets.js` 파일에 Google OAuth Client ID 설정
2. 로컬 서버 실행: `python -m http.server 5500`
3. 브라우저에서 `http://localhost:5500` 접속
4. Google 로그인

## 📚 문서

**🏠 메인 페이지**: [docs/index.md](./docs/index.md) ⭐

**새 세션에서 작업 시작 전 반드시 읽어주세요:**

### Architecture (설계)
- [프로젝트 개요](./docs/architecture/overview.md) - 무엇을, 왜 만드는가
- [설계 원칙](./docs/architecture/design-principles.md) ⭐ - 투명성, 단일책임, 멱등성, 확장성
- [전체 Architecture 문서](./docs/architecture/README.md)

### Guides (가이드)
- [새 세션 시작 가이드](./docs/guides/getting-started.md) ⭐
- [새 기능 추가하기](./docs/guides/adding-features.md) ⭐ - 체크리스트 포함
- [전체 Guides 문서](./docs/guides/README.md)

### Features (기능 설계)
- [초기화 프로세스](./docs/features/initialization.md) - Phase 기반 아키텍처
- [전체 Features 문서](./docs/features/README.md)

## 🏗️ 프로젝트 구조

```
Ghostwriter/
├── docs/               # 📚 Wiki 형태 설계 문서
│   ├── index.md       # 문서 메인 페이지
│   ├── architecture/  # 아키텍처 문서
│   ├── features/      # 기능별 상세 설계
│   └── guides/        # How-to 가이드
├── src/
│   ├── auth/          # 인증
│   ├── drive/         # Google Drive API
│   ├── llm/           # LLM 통합
│   ├── memory/        # 스토리지 관리
│   ├── persona/       # 캐릭터 관리
│   ├── ui/            # UI 컨트롤러
│   └── utils/         # 유틸리티
└── index.html
```

## 🎯 설계 원칙

1. **투명성** - 모든 드라이브 작업은 인웹 로그에 표시
2. **단일 책임** - 각 모듈은 하나의 명확한 책임만
3. **멱등성** - 같은 작업을 여러 번 수행해도 안전
4. **확장성** - Phase 기반 플러그인 시스템

상세 내용은 [docs/architecture/design-principles.md](./docs/architecture/design-principles.md) 참조

## 📄 라이선스

MIT? (예정)
