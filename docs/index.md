# Ghostwriter 문서

> 서버리스 AI 롤플레이 및 소설 작성 클라이언트

**마지막 업데이트**: 2026-02-15

---

## 🚀 빠른 시작

- **처음 오셨나요?** → [프로젝트 개요](./architecture/overview.md)
- **새 세션 시작?** → [시작 가이드](./guides/getting-started.md)
- **새 기능 추가?** → [기능 추가 가이드](./guides/adding-features.md) ⭐
- **특정 기능 찾기?** → [기능 목록](#features)

---

## 📚 문서 구조

### 🏗️ Architecture (아키텍처)

프로젝트의 근간이 되는 설계

- [프로젝트 개요](./architecture/overview.md) - 무엇을, 왜 만드는가
- [설계 원칙](./architecture/design-principles.md) ⭐ - 모든 개발의 기준
- [프로젝트 구조](./architecture/project-structure.md) - 디렉토리 & 모듈
- [데이터 흐름](./architecture/data-flow.md) - Drive 구조 & status.json
- [코딩 컨벤션](./architecture/coding-conventions.md) - 네이밍 & 스타일
- [기술 부채](./architecture/tech-debt.md) - 알려진 이슈 & 개선 계획

### ⚙️ Features (기능별 상세 설계) {#features}

각 기능의 깊이 있는 설계 문서

- [초기화 프로세스](./features/initialization.md) 🟡 - Phase 기반 아키텍처
- [LLM 통합](./features/llm-integration.md) 🟢 - Provider 패턴
- [인증 시스템](./features/authentication.md) 🟢
- [스토리지 관리](./features/storage.md) 🟢
- [캐릭터 관리](./features/character-management.md) ⚪ (계획 중)
- [세션 관리](./features/session-management.md) ⚪ (계획 중)

### 📚 Guides (가이드)

How-to 문서

- [새 세션 시작 가이드](./guides/getting-started.md) ⭐
- [새 기능 추가하기](./guides/adding-features.md) ⭐ - 체크리스트 포함
- [LLM 프로바이더 추가](./guides/adding-llm-provider.md)
- [테스트 작성](./guides/testing.md)

### 📖 API Reference (API 레퍼런스) 🚧

각 서비스의 API 문서 (향후)

- Drive Service (계획 중)
- LLM Service (계획 중)
- Storage Manager (계획 중)

---

## 💡 새 세션 시작 시 체크리스트

1. ✅ [프로젝트 개요](./architecture/overview.md) 읽기
2. ✅ [설계 원칙](./architecture/design-principles.md) 확인
3. ✅ 작업 영역 관련 [Features](./features/) 문서 읽기
4. ✅ 원칙을 따르며 개발
5. ✅ 변경 사항이 있으면 문서도 업데이트

---

## 🔍 빠른 검색

**용어/개념별 찾기**:

| 찾고 있는 것 | 문서 |
|-------------|------|
| 설계 원칙 4가지 | [design-principles.md](./architecture/design-principles.md) |
| 폴더 구조 | [project-structure.md](./architecture/project-structure.md) |
| Drive 폴더 구조 | [data-flow.md](./architecture/data-flow.md) |
| 로그인 후 흐름 | [initialization.md](./features/initialization.md) |
| LLM Provider 추가 | [adding-llm-provider.md](./guides/adding-llm-provider.md) |
| 코딩 스타일 | [coding-conventions.md](./architecture/coding-conventions.md) |
| **새 기능 추가** | [adding-features.md](./guides/adding-features.md) ⭐ |

---

## 📊 상태 표시

- 🟢 구현 완료
- 🟡 개발 중 / 리팩토링 예정
- ⚪ 계획 중
- 🚧 작성 중

---

**이 문서들은 프로젝트의 두뇌입니다. 살아있는 문서로 유지해주세요!**
