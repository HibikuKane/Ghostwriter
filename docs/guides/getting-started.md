[메인](../index.md) > [Guides](./README.md) > 새 세션 시작 가이드

# 새 세션 시작 가이드

> **목적**: AI 에이전트와 새로운 대화 세션에서 작업을 시작할 때 이 가이드를 따르세요.

---

## 🎯 왜 이 가이드가 필요한가?

세션 간 컨텍스트가 유실되면:
- ❌ 프로젝트의 설계 원칙을 모르고 작업
- ❌ 기존 패턴을 무시하고 중복 코드 생성
- ❌ 문서화되지 않은 변경사항 발생

이 가이드대로 하면:
- ✅ 일관된 코드 품질 유지
- ✅ 설계 원칙 준수
- ✅ 문서와 코드의 동기화

---

## 📋 체크리스트

### 1단계: 문서 읽기 (필수)

AI 에이전트에게 다음을 요청하세요:

```
docs/index.md를 읽고, 내가 작업할 [영역]과 관련된 문서들을 찾아줘.
```

**반드시 읽어야 할 문서**:
- [ ] [프로젝트 개요](../architecture/overview.md) - 프로젝트 전체 이해
- [ ] [설계 원칙](../architecture/design-principles.md) ⭐ - 모든 개발의 기준

**영역별 추가 문서**:
- 초기화 관련 → [initialization.md](../features/initialization.md)
- LLM 관련 → [llm-integration.md](../features/llm-integration.md)
- 스토리지 관련 → [storage.md](../features/storage.md)

### 2단계: 현재 상태 파악

- [ ] 작업할 영역의 코드 확인
- [ ] [기술 부채](../architecture/tech-debt.md) 확인
  - 알려진 이슈가 있는가?
  - 개선 예정 항목이 있는가?

### 3단계: 작업 시작

- [ ] [설계 원칙](../architecture/design-principles.md) 염두에 두기
- [ ] 새 기능 추가 시 → [adding-features.md](./adding-features.md) 따르기

### 4단계: 작업 완료 후

- [ ] 문서 업데이트
  - 새 기능? → `docs/features/{기능명}.md` 작성
  - 구조 변경? → [project-structure.md](../architecture/project-structure.md) 업데이트
  - 이슈 발견? → [tech-debt.md](../architecture/tech-debt.md)에 추가

---

## 💬 AI 에이전트와 대화 예시

### 좋은 예시 ✅

```
User: 초기화 로직에 새로운 Phase를 추가하고 싶어.

Agent: 먼저 관련 문서를 확인하겠습니다.
- docs/features/initialization.md 읽기
- docs/guides/adding-features.md 읽기

[문서 확인 후]

initialization.md에 따르면 Phase 기반 플러그인 시스템을 사용하고 있습니다.
새 Phase를 추가하려면...
```

### 나쁜 예시 ❌

```
User: 초기화 로직에 새로운 Phase를 추가하고 싶어.

Agent: [문서 읽지 않고]
새 파일을 만들어서 코드를 작성하겠습니다... 
[기존 패턴 무시]
```

---

## 🔍 자주 묻는 질문

### Q1: 매번 모든 문서를 읽어야 하나요?

**A**: 아니요. 작업 영역과 관련된 문서만 읽으면 됩니다.

| 작업 영역 | 읽을 문서 |
|----------|----------|
| 초기화 | overview.md, design-principles.md, initialization.md |
| LLM 통합 | overview.md, design-principles.md, llm-integration.md |
| UI 작업 | overview.md, coding-conventions.md |
| 새 기능 추가 | overview.md, design-principles.md, adding-features.md |

### Q2: 설계 원칙을 왜 그렇게 강조하나요?

**A**: 4가지 설계 원칙(투명성, 단일 책임, 멱등성, 확장성)은 이 프로젝트의 **DNA**입니다. 
이를 무시하면:
- A를 수정하면 B, C가 파손되는 연쇄 부작용 발생
- 사용자가 시스템 동작을 신뢰하지 못함
- 코드 확장이 어려워짐

### Q3: 문서와 코드가 다르면?

**A**: 코드가 문서보다 최신일 가능성이 있습니다. 
1. 코드를 확인
2. 문서를 업데이트
3. User에게 알림

---

## 📚 관련 문서

- [프로젝트 개요](../architecture/overview.md)
- [설계 원칙](../architecture/design-principles.md) ⭐
- [새 기능 추가하기](./adding-features.md)

---

[← Guides 홈](./README.md) | [← 메인으로](../index.md)
