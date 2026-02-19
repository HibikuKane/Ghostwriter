# 새 세션 시작 가이드

> **목적**: AI 에이전트가 새로운 대화 세션에서 작업을 시작할 때 따를 가이드.

---

## 📋 컨텍스트 로딩 체크리스트

### 1단계: README 읽기 (필수, 항상)

`.agent/README.md`를 읽고, 작업 유형에 맞는 문서를 확인.

### 2단계: 작업 유형별 추가 문서

| 작업 유형 | 필수 문서 | 선택 문서 |
|-----------|----------|----------|
| 새 기능 개발 | `principles/design-principles.md` | `reference/project-structure.md` |
| 기존 기능 수정 | `reference/project-structure.md` | `reference/tech-debt.md` |
| 방향 논의 | `.ideas/current-status.md` | `.ideas/roadmap.md` |
| 버그 수정 | `reference/tech-debt.md` | 해당 모듈 코드 |
| 전체 리뷰 | `.ideas/current-status.md` | `.ideas/features.md` |

### 3단계: 작업 완료 후

- [ ] 구조 변경 시 `reference/project-structure.md` 업데이트
- [ ] 이슈 발견 시 `reference/tech-debt.md` 업데이트
- [ ] 기능 진척 시 `.ideas/current-status.md` 업데이트

---

## 💡 핵심 원칙 요약 (빠른 참조)

- **투명성**: 드라이브 작업은 반드시 로그 표시
- **단일 책임**: 모듈 하나 = 책임 하나
- **멱등성**: `findOrCreate` 패턴
- **확장성**: Phase 기반, Provider 패턴

---

## 📚 관련 문서

- [설계 원칙 상세](../principles/design-principles.md)
- [코딩 컨벤션](../principles/coding-conventions.md)
- [새 기능 추가하기](./adding-features.md)
