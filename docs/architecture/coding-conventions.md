[메인](../index.md) > [Architecture](./README.md) > 코딩 컨벤션

# 코딩 컨벤션

> **목적**: Ghostwriter 프로젝트의 코딩 스타일 가이드입니다.

**마지막 업데이트**: 2026-02-15

---

## 📝 JavaScript

### 문법

- ✅ ES6+ 문법 사용
- ✅ 모듈 시스템 (`import`/`export`)
- ✅ `async`/`await` (Promise보다 선호)
- ❌ `var` 사용 금지 (`let`, `const` 사용)

### JSDoc 주석

모든 public 함수에 JSDoc 작성:

```javascript
/**
 * 폴더를 찾거나 생성합니다.
 * @param {string} name - 폴더명
 * @param {string|null} [parentId=null] - 부모 폴더 ID (선택)
 * @returns {Promise<string>} 폴더 ID
 */
async function findOrCreateFolder(name, parentId = null) {
    // ...
}
```

---

## 🏷️ 네이밍 컨벤션

| 타입 | 컨벤션 | 예시 | 설명 |
|------|--------|------|------|
| **파일명** | `kebab-case.js` | `auth.service.js` | 소문자 + 하이픈 |
| **디렉토리명** | `kebab-case` | `llm/`, `memory/` | 소문자 + 하이픈 |
| **클래스명** | `PascalCase` | `InitializationOrchestrator` | 첫 글자 대문자 |
| **함수/변수명** | `camelCase` | `getUserSettings()` | 소문자 시작 |
| **상수명** | `UPPER_SNAKE_CASE` | `FOLDER_NAME` | 전부 대문자 + 언더스코어 |
| **Private 필드** | `_camelCase` | `_internalState` | 언더스코어 접두사 |

### 네이밍 예시

```javascript
// ✅ 좋은 예
const MAX_RETRIES = 3;                    // 상수
class StorageManager { }                   // 클래스
function getUserSettings() { }             // 함수
let currentUser = null;                    // 변수
this._privateMethod() { }                  // Private 메서드

// ❌ 나쁜 예
const maxRetries = 3;                      // 상수는 대문자
class storageManager { }                   // 클래스는 PascalCase
function GetUserSettings() { }             // 함수는 camelCase
let CurrentUser = null;                    // 변수는 camelCase
```

---

## 📋 파일 네이밍 패턴

| 타입 | 패턴 | 예시 |
|------|------|------|
| Service | `{name}.service.js` | `auth.service.js` |
| Controller | `{name}.controller.js` | `chat.controller.js` |
| Manager | `{name}.manager.js` | `storage.manager.js` |
| Repository | `{name}.repository.js` | `chat.repository.js` |
| Provider | `{name}.provider.js` | `gemini.provider.js` |
| Utility | `{name}.js` | `logger.js` |

---

## 📊 로깅

### 로그 레벨

| 레벨 | 사용 시기 | 예시 |
|------|----------|------|
| `'info'` | 일반 정보 | `log('Starting initialization...', 'info')` |
| `'success'` | 성공 | `log('Workspace created!', 'success')` |
| `'warning'` | 경고 (계속 진행) | `log('Settings not found, using defaults', 'warning')` |
| `'error'` | 에러 | `log('Failed to load file', 'error')` |
| `'debug'` | 디버깅용 (향후) | `log('Debug info', 'debug', { data })` |

### 로깅 예시

```javascript
// ✅ 좋은 예: 명확하고 사용자 친화적
log('📁 Creating folder: "characters"...', 'info');
log('📄 Reading file: status.json', 'info');
log('✅ Settings saved successfully', 'success');
log('❌ Failed to connect to API', 'error');

// ✅ 좋은 예: 민감한 정보는 숨김
log('API Key saved', 'success', { 
    provider: 'gemini',
    keyLength: apiKey.length  // 길이만 표시
});

// ❌ 나쁜 예: 너무 기술적
log('gapi.client.drive.files.create() called', 'info');

// ❌ 나쁜 예: 민감 정보 노출
log(`API Key: ${apiKey}`, 'info'); // 절대 안됨!
```

---

## 🎨 코드 스타일

### 들여쓰기

- **4칸 공백** (탭 아님)

### 따옴표

- **작은따옴표 (`'`)** 선호
- 문자열 보간 시 **백틱 (` `` `)** 사용

```javascript
// ✅ 좋은 예
const message = 'Hello world';
const greeting = `Hello, ${name}!`;

// ❌ 나쁜 예
const message = "Hello world";  // 큰따옴표 지양
```

### 세미콜론

- 항상 사용

### 중괄호

- 항상 사용 (한 줄 if문도)

```javascript
// ✅ 좋은 예
if (condition) {
    doSomething();
}

// ❌ 나쁜 예
if (condition) doSomething();
```

---

## 📦 모듈 구조

### 파일 구조 패턴

```javascript
/**
 * 파일 설명
 */

// 1. Imports
import { something } from './module.js';

// 2. Constants
const CONSTANT = 'value';

// 3. Class or Functions
export class MyClass {
    // ...
}

// 4. Exports (singleton 패턴 시)
export const instance = new MyClass();
```

### Export 스타일

```javascript
// ✅ 좋은 예: Named export
export function doSomething() { }
export class MyClass { }

// ✅ 좋은 example: Singleton
export const myService = new MyService();

// ❌ 나쁜 예: Default export (지양)
export default class MyClass { }
```

---

## 🧪 에러 핸들링

### Try-Catch 사용

```javascript// ✅ 좋은 예: 에러 로깅 + 재throw
try {
    await dangerousOperation();
} catch (error) {
    log(`Operation failed: ${error.message}`, 'error');
    throw error; // 호출자가 처리할 수 있도록
}

// ✅ 좋은 예: 에러를 처리하고 기본값 반환
try {
    return await fetchSettings();
} catch (error) {
    log('Failed to load settings, using defaults', 'warning');
    return DEFAULT_SETTINGS;
}
```

---

## 📚 관련 문서

- [설계 원칙](./design-principles.md) - 왜 이런 컨벤션을 사용하는가
- [프로젝트 구조](./project-structure.md) - 파일 배치 규칙

---

[← Architecture 홈](./README.md) | [← 메인으로](../index.md)

---

**마지막 업데이트**: 2026-02-15
