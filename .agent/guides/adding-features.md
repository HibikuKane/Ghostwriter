# 새 기능 추가하기

> **목적**: Ghostwriter에 새로운 기능을 추가할 때 따라야 할 체크리스트와 가이드.

---

## 📋 체크리스트

### 1. 계획 단계

- [ ] [설계 원칙](../principles/design-principles.md) 확인 (투명성, 단일 책임, 멱등성, 확장성)
- [ ] 기존 패턴 조사 — 재사용 가능한 패턴이 있는가?

### 2. 구현 단계

- [ ] `src/` 아래 적절한 위치 확인
- [ ] [코딩 컨벤션](../principles/coding-conventions.md) 준수
  - 파일명: `kebab-case.js`, 클래스명: `PascalCase`, 함수/변수: `camelCase`
- [ ] JSDoc 주석 — 모든 public 함수에 작성
- [ ] 로깅 — 주요 동작에 `log()` 추가, 민감 정보 노출 금지

### 3. 테스트 단계

- [ ] 브라우저에서 기능 동작 확인
- [ ] 인웹 로그가 명확하게 표시되는가?
- [ ] 에러 케이스 테스트

### 4. 문서화 단계

- [ ] [프로젝트 구조](../reference/project-structure.md) 업데이트 (새 파일/디렉토리 추가 시)
- [ ] [기술 부채](../reference/tech-debt.md) 업데이트 (새 이슈 추가 or 해결된 이슈 체크)
- [ ] `.ideas/current-status.md` 업데이트 (기능 진행 상태 반영)

---

## 🔍 예시: Phase 기반 기능 추가

초기화 관련 기능은 Phase 클래스로 추가:

```javascript
// src/initialization/phases/new-phase.js
import { InitializationPhase } from './initialization-phase.js';

export class NewPhase extends InitializationPhase {
    constructor() {
        super('newPhase', 'New phase description...');
        this.isCritical = false; // 실패해도 계속 진행
    }

    canExecute(context) {
        return context.workspace?.rootFolderId != null;
    }

    async execute(context) {
        log('Executing new phase...', 'info');
        const result = await doSomething();
        return { data: result };
    }
}
```

등록: `orchestrator.registerPhase(new NewPhase());`

---

## ⚠️ DO / DON'T

### DO ✅
- 작은 단위로 작업 — 한 번에 한 기능
- 기존 패턴 재사용 — 바퀴 재발명 금지
- 투명하게 로깅 — 사용자가 무슨 일이 일어나는지 알 수 있도록

### DON'T ❌
- 설계 원칙 무시
- 문서 업데이트 생략
- 거대한 파일 생성 — 파일은 작고 집중적으로
- 테스트 생략

---

## 📚 관련 문서

- [설계 원칙](../principles/design-principles.md) - 반드시 읽기
- [프로젝트 구조](../reference/project-structure.md) - 파일 위치 결정
- [코딩 컨벤션](../principles/coding-conventions.md) - 스타일 가이드
- [초기화 프로세스](../reference/initialization.md) - Phase 시스템 예시
