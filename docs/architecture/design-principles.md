[메인](../index.md) > [Architecture](./README.md) > 설계 원칙

# 설계 원칙

> **목적**: Ghostwriter 프로젝트의 모든 개발은 이 4가지 원칙을 따라야 합니다.

**마지막 업데이트**: 2026-02-15

---

## 1. 투명성 (Transparency)

### 원칙

사용자의 Google Drive를 건드리는 프로젝트이므로, **모든 동작이 투명**해야 합니다.

### 구현

- ✅ 모든 드라이브 작업은 인웹 로그에 표시
- ✅ 어떤 폴더/파일을 읽고 쓰는지 명확히 표시
- ✅ 민감한 정보(API 키 등)는 로그에 표시하지 않음

### 예시

```javascript
//✅ 좋은 예
log('📁 Creating folder: "characters"...', 'info');
log('📄 Reading file: status.json', 'info');
log('✅ Settings saved', 'success', { provider: 'gemini' });

// ❌ 나쁜 예
// 아무 로그도 없이 조용히 파일 생성
await createFile(...); // 사용자가 모름!

// ❌ 나쁜 예 - 민감한 정보 노출
log(`API Key: ${apiKey}`, 'info'); // 절대 안됨!
```

### 왜 중요한가?

- 사용자가 시스템을 신뢰할 수 있음
- 문제 발생 시 디버깅이 쉬움
- 오픈소스 정신과 일치

---

## 2. 단일 책임 원칙 (Single Responsibility Principle)

### 원칙

각 모듈은 **하나의 명확한 책임**만 가집니다.

### 구현

| 모듈 | 책임 | 하지 않는 것 |
|------|------|-------------|
| `auth.service.js` | 인증만 | 드라이브 조작 X |
| `drive.service.js` | 드라이브 API 래퍼만 | 비즈니스 로직 X |
| `initialization.orchestrator.js` | 초기화 흐름 제어만 | 직접 파일 조작 X |

### 예시

```javascript
// ✅ 좋은 예: DriveService는 순수 API 래퍼
class DriveService {
    async findOrCreateFolder(name, parentId) {
        // Drive API만 호출
        // 비즈니스 로직 없음
    }
}

// ✅ 좋은 예: Orchestrator는 흐름 제어만
class InitializationOrchestrator {
    async initialize() {
        // 각 Phase를 순서대로 실행
        // 직접 드라이브 조작 안 함
        await workspaceInitializer.ensureStructure();
        await settingsInitializer.load();
    }
}

// ❌ 나쁜 예: AuthService가 너무 많은 일을 함
class AuthService {
    async signIn() {
        // ... 인증 로직 ...
        
        // ❌ 드라이브 조작까지 하면 안됨!
        await createFolder('Ghostwriter_Data');
        await loadSettings();
        await initializeUI();
    }
}
```

### 왜 중요한가?

- A를 수정해도 B, C가 파손되지 않음
- 테스트가 쉬워짐
- 코드 이해가 쉬워짐

---

## 3. 멱등성 (Idempotency)

### 원칙

같은 작업을 여러 번 수행해도 **결과가 동일**해야 합니다.

### 구현

폴더/파일 생성은 항상 **"찾기 → 없으면 생성"** 패턴 사용

### 예시

```javascript
// ✅ 좋은 예: 멱등적 폴더 생성
async function findOrCreateFolder(name, parentId) {
    // 1. 먼저 찾기
    const existing = await searchFolder(name, parentId);
    if (existing) {
        return existing.id; // 있으면 반환
    }
    
    // 2. 없으면 생성
    const created = await createFolder(name, parentId);
    return created.id;
}

// ✅ 여러 번 호출해도 안전
await findOrCreateFolder('characters'); // 생성됨
await findOrCreateFolder('characters'); // 기존 것 반환 (중복 생성 안함)
await findOrCreateFolder('characters'); // 기존 것 반환

// ❌ 나쁜 예: 멱등하지 않음
async function createFolder(name) {
    // 항상 새로 생성 시도
    return await gapi.client.drive.files.create(...);
    // 여러 번 호출하면 중복 폴더 생성됨!
}
```

### 왜 중요한가?

- 재시도가 안전함 (에러 발생 시 다시 실행 가능)
- 중복 작업 방지
- 사용자가 여러 기기에서 동시 접속해도 안전

---

## 4. 확장성 (Extensibility)

### 원칙

새 기능 추가 시 **기존 코드를 최소한으로 수정**

### 구현

- Phase 기반 플러그인 시스템
- Provider 패턴

### 예시

#### Phase 기반 플러그인 시스템

```javascript
// 새 Phase 추가 시 Orchestrator 수정 불필요
class InitializationOrchestrator {
    constructor() {
        // 기존 Phase들
        this.registerPhase(new WorkspacePhase());
        this.registerPhase(new SettingsPhase());
        
        // 🆕 새 Phase 추가는 한 줄이면 끝!
        this.registerPhase(new CharactersLoadPhase());
    }
    
    // initialize() 로직은 변경 안함!
    async initialize() {
        for (const phase of this.phases) {
            await phase.execute(this.context);
        }
    }
}
```

#### Provider 패턴

```javascript
// 새 LLM Provider 추가
// 1. 파일 생성: src/llm/providers/openai.provider.js
export class OpenAIProvider extends BaseProvider {
    async chat(messages) {
        // OpenAI 로직
    }
}

// 2. 등록 (llm.service.js에 한 줄 추가)
this.providers.set('openai', new OpenAIProvider());

// 끝! 다른 코드 수정 없음
```

### 왜 중요한가?

- 기존 코드 파손 위험 최소화
- 새 기능 추가가 쉬워짐

---

## 🎯 원칙 적용 체크리스트

새로운 코드를 작성할 때:

- [ ] **투명성**: 사용자가 무슨 일이 일어나는지 알 수 있는가?
- [ ] **단일 책임**: 이 모듈이 하나의 명확한 책임만 가지는가?
- [ ] **멱등성**: 여러 번 실행해도 안전한가?
- [ ] **확장성**: 향후 비슷한 기능을 추가할 때 이 코드를 수정해야 하는가?

---

## 📚 관련 문서

- [프로젝트 개요](./overview.md) - 왜 이런 원칙을 선택했는가
- [새 기능 추가하기](../guides/adding-features.md) - 원칙을 실제로 적용하는 방법
- [초기화 프로세스](../features/initialization.md) - 4가지 원칙이 모두 적용된 예시

---

[← Architecture 홈](./README.md) | [← 메인으로](../index.md)

---

**마지막 업데이트**: 2026-02-15
