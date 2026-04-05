# 현재 구현 상태

마지막 업데이트: 2026-04-05

> **참고**: 이 문서는 현재 작업 중인 기능들의 스냅샷입니다.  
> 프로젝트가 진행되면서 새로운 기능이 추가되거나 우선순위가 변경될 수 있습니다.

---

## 📊 전체 진행 상황

```
Phase 1:    [████████████████] 100% ✅
Bridge:     [████████████████] 100% ✅
Phase 1.5:  [████████████████] 100% ✅
Phase 2:    [████████████████] 100% ✅
Phase 3:    [████████████████] 100% ✅ ← 완료
Phase 4:    [████████████████] 100% ✅ ← 완료
```

---

## ✅ 안정적으로 작동하는 기능

### 인프라
- ✅ Google OAuth 2.0 인증
- ✅ Google Drive 파일 스토리지 (`Ghostwriter_Data/`)
- ✅ LLM 통합 (다중 프로바이더: Gemini, OpenAI, Claude, 커스텀)
- ✅ 기본 채팅 UI
- ✅ 설정 관리 시스템
- ✅ 테스트 자동화 (Vitest — 단위 테스트 **160개**)
- ✅ E2E 스모크 테스트 (Playwright — 로그인 화면 렌더링 1개)
- ✅ GitHub Pages 배포 — https://hibikukane.github.io/Ghostwriter/
- ✅ OAuth 프로덕션 인증 — 불특정 다수 로그인 가능
- ✅ 토큰 자동 갱신, 네트워크 타임아웃, 인앱 토스트 알림
- ✅ **Claude Code 하네스** — CLAUDE.md + PostToolUse 훅 (src/*.js 수정 시 자동 테스트)
- ✅ **로컬 캐시 레이어** — 2-Tier (메모리 + SessionStorage), Drive 호출 최소화

### Phase 1.5 채팅 UX (완료)
- ✅ 마크다운 렌더링, 응답 재생성(리롤), 리롤 이력 네비게이터
- ✅ 모바일 반응형, 코드블록 줄바꿈

### Phase 2 캐릭터 시스템 확장 (완료)
- ✅ **#2: 캐릭터 에셋 관리** — 상세 설명 필드, 키워드 트리거, 아바타 이미지
- ✅ **#3: 모델 세부 설정** — Temperature / Max Tokens / Top-P 슬라이더 UI
- ✅ **인앱 가이드 시스템** — ? 버튼 기반 툴팁 팝업

### Phase 3 고급 대화 모드 & 프롬프트 제어 (2026-04-05 완료)
- ✅ **#1.2: 롤플레잉 모드** (PR #24) — 모드 토글 UI + 시스템 프롬프트 주입
- ✅ **#4: 프롬프트 제어 UI** (PR #25) — 슬롯 기반 순서/토글/커스텀 블록
- ✅ **#10: 프리셋 시스템** (PR #27) — 프롬프트 파이프라인 설정 저장/불러오기
  - `presetService` — CRUD + Drive 저장, 프롬프트 탭 상단 프리셋 바 UI
- ✅ **#1.3: 소설가 모드** (PR #28) — 📖 릴레이 소설 작성 모드
  - `CHAT_MODES.NOVELIST`, `getNovelistHint()`, sendMessage/reroll 힌트 주입
- ✅ **#13: 프롬프트 인스펙터** (PR #29) — 🔍 최종 LLM 파이프라인 시각화
  - 역할별 메시지 블록, 토큰 추정 (~chars/3.5), 요약 바
- ✅ **채팅 기록 편집** (PR #30) — ✏/× 메시지 수정/삭제 + 이후 재생성
  - `messageIds[]` 병렬 관리, 인라인 textarea 편집

### Phase 4 다언어 & UX 개선 (2026-04-05 완료)
- ✅ **#5: 다국어 UI** (PR #31) — 한국어 / 영어 / 일본어 언어팩
  - `I18nService` — `t(key)`, `setLang()`, `applyToDOM()`
  - `data-i18n` / `data-i18n-placeholder` / `data-i18n-title` DOM 속성 방식
  - 설정 탭 언어 선택 드롭다운, localStorage 언어 지속

---

## 🔄 부분 구현

_없음_

---

## ❌ 미구현 기능

### Phase 5+
- ⬜ **#6: 보조 모델 시스템** — 일러스트 프롬프트 생성기, 가상 댓글봇
- ⬜ **#11: 캐릭터별 커스텀 CSS** — CSS 파일 업로드, 동적 스타일 로더
- ⬜ **#7: 하이파메모리** (장기 기억 / RAG) — Phase 6

---

## 🏗️ 인프라 현황

### 📁 디렉토리 구조 (Google Drive)
```
Ghostwriter_Data/
├── status.json
├── characters/
├── sessions/
├── personas/        ✅ 구현 완료
├── presets/         ✅ 구현 완료 (P3-3)
└── settings/
```

### 테스트 현황
```
총 160개 단위 테스트 (Vitest) + E2E 1개 (Playwright)
├── src/utils/markdown.test.js              5개
├── src/memory/cache.manager.test.js        8개
├── src/llm/providers/base-provider.test.js 12개
├── src/llm/llm.service.test.js             20개
├── src/llm/prompt-config.service.test.js   19개
├── src/llm/preset.service.test.js          15개  (P3-3)
├── src/chat/mode.service.test.js           18개  (P3-4 +6)
├── src/persona/character.service.test.js   31개
├── src/persona/persona.service.test.js     20개
└── src/i18n/i18n.service.test.js           12개  (P4-1)
e2e/smoke.test.js                           1개
```

---

## 🎯 다음 단계

**현재 위치**: Phase 4 완료  
**다음**: Phase 5 — 보조 기능 & 폴리싱
- P5-1 (보조 모델 시스템): 즉시 시작 가능
- P5-2 (커스텀 CSS): 즉시 시작 가능
