# Ghostwriter - AI 에이전트 빠른 참조

> **목적**: 새 세션에서 작업 시작 전 이 파일이 자동으로 읽힙니다. 프로젝트의 핵심 정보를 빠르게 파악하세요.

---

## 🚨 작업 시작 전 필수 체크

### 1. 설계 원칙 확인 (가장 중요!)

**반드시 읽어야 할 문서**: [`docs/architecture/design-principles.md`](../docs/architecture/design-principles.md)

**4가지 핵심 원칙**:
1. **투명성** - 모든 Drive 작업은 인웹 로그에 표시
2. **단일 책임** - 각 모듈은 하나의 명확한 책임만
3. **멱등성** - 같은 작업을 여러 번 수행해도 안전
4. **확장성** - Phase 기반 플러그인 시스템

### 2. 프로젝트 이해

- **무엇인가**: Google Drive 기반 서버리스 AI 롤플레이/소설 작성 클라이언트
- **핵심 가치**: 완전한 데이터 소유권, 서버 비용 $0
- **상세**: [`docs/architecture/overview.md`](../docs/architecture/overview.md)

### 3. 새 기능 추가 시

**체크리스트와 템플릿**: [`docs/guides/adding-features.md`](../docs/guides/adding-features.md)

---

## 📁 프로젝트 정보

| 항목 | 내용 |
|------|------|
| **언어** | Vanilla JavaScript (ES6+) |
| **스타일** | 4칸 공백, 작은따옴표, 세미콜론 필수 |
| **아키텍처** | Phase 기반 플러그인 시스템 |
| **스토리지** | Google Drive API (`drive.file` 스코프) |
| **LLM** | Provider 패턴 (현재: Gemini) |

---

## 🗺️ 주요 문서 맵

### Architecture (설계)
- [`design-principles.md`](../docs/architecture/design-principles.md) ⭐⭐⭐ - **가장 중요**
- [`overview.md`](../docs/architecture/overview.md) - 프로젝트 소개
- [`project-structure.md`](../docs/architecture/project-structure.md) - 디렉토리 구조
- [`data-flow.md`](../docs/architecture/data-flow.md) - Drive 구조 & status.json
- [`coding-conventions.md`](../docs/architecture/coding-conventions.md) - 코딩 스타일
- [`tech-debt.md`](../docs/architecture/tech-debt.md) - 알려진 이슈

### Features (기능별 상세)
- [`initialization.md`](../docs/features/initialization.md) - 초기화 Phase 시스템 (리팩토링 예정)

### Guides (가이드)
- [`getting-started.md`](../docs/guides/getting-started.md) - 새 세션 시작 가이드
- [`adding-features.md`](../docs/guides/adding-features.md) - 체크리스트 포함

---

## 🎯 작업 영역별 읽을 문서

| 작업 내용 | 읽을 문서 |
|----------|----------|
| 초기화 관련 | design-principles.md, initialization.md |
| LLM 통합 | design-principles.md, project-structure.md |
| 새 기능 추가 | design-principles.md, adding-features.md |
| 버그 수정 | tech-debt.md, 해당 기능 문서 |

---

## ⚠️ 절대 하지 말 것

- ❌ 설계 원칙 무시 (A 수정하면 B, C가 파손되는 연쇄 부작용 발생)
- ❌ Drive 작업 시 로그 생략 (투명성 원칙 위반)
- ❌ 민감 정보(API 키) 로그 출력
- ❌ Default export 사용 (Named export만 사용)
- ❌ 거대한 단일 파일 생성 (작고 집중적으로)

---

## 💡 빠른 시작

```
1. 설계 원칙 읽기: docs/architecture/design-principles.md
2. 작업 영역 관련 문서 확인
3. 원칙을 따르며 개발
4. 변경 사항 문서 업데이트
```

---

**문서 메인**: [`docs/index.md`](../docs/index.md)
