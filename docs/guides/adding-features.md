[메인](../index.md) > [Guides](./README.md) > 새 기능 추가하기

# 새 기능 추가하기

> **목적**: 이 문서는 Ghostwriter에 새로운 기능을 추가할 때 따라야 할 체크리스트와 전반적인 가이드를 제공합니다.

---

## 📋 체크리스트: 새 기능 추가 시

새로운 기능을 추가할 때 아래 체크리스트를 따르세요:

### 1. 계획 단계

- [ ] **설계 원칙 확인**
  - [ ] [4가지 설계 원칙](../architecture/design-principles.md) 검토
  - [ ] 투명성, 단일 책임, 멱등성, 확장성을 고려했는가?

- [ ] **기존 패턴 조사**
  - [ ] [Features](../features/README.md) 문서에서 유사한 기능 확인
  - [ ] 재사용 가능한 패턴이 있는가?

- [ ] **설계 문서 작성**
  - [ ] `docs/features/{기능명}.md` 생성
  - [ ] [Feature 문서 템플릿](#feature-문서-템플릿) 사용

### 2. 구현 단계

- [ ] **디렉토리 구조**
  - [ ] `src/` 아래 적절한 위치 확인
  - [ ] 새 디렉토리가 필요하면 생성

- [ ] **코딩 컨벤션 준수**
  - [ ] [코딩 컨벤션](../architecture/coding-conventions.md) 확인
  - [ ] 파일명: `kebab-case.js`
  - [ ] 클래스명: `PascalCase`
  - [ ] 함수/변수명: `camelCase`

- [ ] **JSDoc 주석 작성**
  - [ ] 모든 public 함수에 JSDoc 추가
  - [ ] 파라미터 및 리턴 타입 명시

- [ ] **로깅 추가**
  - [ ] 주요 동작에 `log()` 추가
  - [ ] 투명성 원칙: 사용자가 무슨 일이 일어나는지 알 수 있도록
  - [ ] 민감한 정보(API 키 등)는 로그에 표시하지 않음

### 3. 테스트 단계

- [ ] **수동 테스트**
  - [ ] 브라우저에서 기능 동작 확인
  - [ ] 에러 케이스 테스트

- [ ] **로그 확인**
  - [ ] 인웹 로그가 명확하게 표시되는가?
  - [ ] 에러 발생 시 적절한 메시지가 표시되는가?

### 4. 문서화 단계

- [ ] **기능 문서 완성**
  - [ ] `docs/features/{기능명}.md` 작성 완료
  - [ ] 배경, 아키텍처, 구현 세부사항, 향후 계획 포함

- [ ] **문서 연결**
  - [ ] `docs/features/README.md`에 링크 추가
  - [ ] `docs/index.md`의 Features 섹션에 추가
  - [ ] 관련 아키텍처 문서에 상호 링크 추가

- [ ] **기술 부채 업데이트**
  - [ ] [tech-debt.md](../architecture/tech-debt.md) 업데이트
  - [ ] 새로운 이슈가 있으면 추가
  - [ ] 해결된 이슈는 체크 표시

- [ ] **프로젝트 구조 업데이트**
  - [ ] 새 파일/디렉토리 추가 시 [project-structure.md](../architecture/project-structure.md) 업데이트

---

## 📐 Feature 문서 템플릿

새로운 기능 문서를 작성할 때 아래 템플릿을 사용하세요:

```markdown
[메인](../index.md) > [Features](./README.md) > {기능명}

# {기능명} 상세 설계

> **상태**: 🟢 구현 완료 / 🟡 개발 중 / ⚪ 계획 중

**마지막 업데이트**: YYYY-MM-DD

---

## 배경 및 목적

왜 이 기능이 필요한가?
- 
- 

## 아키텍처

### 시퀀스 다이어그램

\```mermaid
sequenceDiagram
    participant A
    participant B
    A->>B: 동작
\```

### 주요 컴포넌트

| 컴포넌트 | 역할 | 파일 위치 |
|----------|------|-----------|
| | | |

## 구현 세부사항

### 파일 구조

\```
src/
└── {모듈}/
    ├── {파일}.js
    └── ...
\```

### 핵심 로직

\```javascript
// 핵심 코드 예시
\```

### 설계 원칙 적용

- **투명성**: 
- **단일 책임**: 
- **멱등성**: 
- **확장성**: 

## 향후 계획

- [ ] 개선 사항 1
- [ ] 개선 사항 2

## 관련 문서

- [설계 원칙](../architecture/design-principles.md)
- [관련 기능](./another-feature.md)
- [← Features 홈](./README.md)

---

**마지막 업데이트**: YYYY-MM-DD
```

---

## 🔍 예시: Phase 기반 기능 추가

Phase 시스템을 사용하는 기능(예: 초기화 관련)을 추가할 때:

### 1. Phase 클래스 생성

```javascript
// src/initialization/phases/new-phase.js
import { InitializationPhase } from './initialization-phase.js';

export class NewPhase extends InitializationPhase {
    constructor() {
        super('newPhase', 'New phase description...');
        this.isCritical = false; // 실패해도 계속 진행
    }

    canExecute(context) {
        // 실행 가능 조건
        return context.workspace?.rootFolderId != null;
    }

    async execute(context) {
        // Phase 로직 구현
        log('Executing new phase...', 'info');
        
        const result = await doSomething();
        
        return {
            // 다음 phase에서 사용할 데이터
            data: result
        };
    }
}
```

### 2. Orchestrator에 등록

```javascript
// src/initialization/initialization.orchestrator.js
import { NewPhase } from './phases/new-phase.js';

constructor() {
    this.phases = [];
    this.context = {};
    
    // 기존 Phase들
    this.registerPhase(new WorkspaceStructurePhase());
    this.registerPhase(new StatusFilePhase());
    
    // 🆕 새 Phase 등록
    this.registerPhase(new NewPhase());
}
```

### 3. 문서 작성

`docs/features/initialization.md`에 새 Phase 내용 추가

---

## ⚠️ 주의사항

### DO ✅

- **작은 단위로 커밋**: 각 체크리스트 항목마다 커밋
- **문서 먼저 작성**: 구현 전 설계 문서 작성 권장
- **기존 패턴 재사용**: 바퀴를 재발명하지 말 것
- **투명하게 로깅**: 사용자가 무슨 일이 일어나는지 알 수 있도록

### DON'T ❌

- **설계 원칙 무시**: 원칙을 어기면 기술 부채 증가
- **문서 생략**: 문서 없는 코드는 유지보수 불가
- **거대한 파일 생성**: 파일은 작고 집중적으로
- **테스트 생략**: 최소한 수동 테스트라도 수행

---

## 💡 팁

- **Phase 시스템 활용**: 초기화 관련 기능은 Phase로 만들면 확장 용이
- **Provider 패턴 활용**: LLM, 스토리지 등 교체 가능한 요소는 Provider 패턴
- **기존 서비스 재사용**: `driveService`, `llmService` 등 이미 있는 서비스 활용

---

## 📚 관련 문서

- [설계 원칙](../architecture/design-principles.md) - 반드시 읽기
- [프로젝트 구조](../architecture/project-structure.md) - 파일 위치 결정
- [코딩 컨벤션](../architecture/coding-conventions.md) - 스타일 가이드
- [초기화 프로세스](../features/initialization.md) - Phase 시스템 예시

---

[← Guides 홈](./README.md) | [← 메인으로](../index.md)
