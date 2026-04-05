# HANDOFF — 세션 간 인계 문서

> 이 파일은 세션이 끝날 때마다 에이전트가 갱신한다.  
> 다음 세션 시작 시 CLAUDE.md 다음으로 읽어야 할 파일.

---

## 📍 현재 시작점

**날짜**: 2026-04-05  
**브랜치**: `develop` (모든 이전 작업 머지 완료)  
**Phase**: Phase 3 전체 PR 제출 완료, Phase 4 P4-1 PR 제출 완료

---

## ✅ 오늘 세션에서 한 일

### P3-3: 프리셋 시스템 (PR #27, WAITING_PR)
- `src/llm/preset.service.js` 신규 — CRUD + Drive 저장/불러오기
- `src/llm/preset.service.test.js` — 15 테스트
- `prompt-control.controller.js` — 프리셋 바 UI (선택/저장/불러오기/삭제)
- `settings.controller.js` — Drive 로드 시 presets 자동 로드

### P3-4: 소설가 모드 (PR #28, WAITING_PR)
- `src/chat/mode.service.js` — NOVELIST 모드 + getNovelistHint()
- `mode.service.test.js` — 6 테스트 추가 (총 18)
- `chat.controller.js` — novelist 힌트 주입 (sendMessage + reroll)
- `index.html` — 📖 소설가 버튼 추가

### P3-5: 프롬프트 인스펙터 (PR #29, WAITING_PR)
- `src/ui/inspector.controller.js` 신규 — buildMessages() 기반 조립
- 역할별 메시지 블록 + 토큰 추정 (~chars/3.5)
- 🔍 버튼 + 모달 (index.html + style.css)

### P3-6: 채팅 기록 편집 (PR #30, WAITING_PR)
- `chat.controller.js` — messageIds[] 병렬 관리
- `_buildMsgActions()` — 호버 시 ✏/× 버튼
- `_deleteMessage()` — 단일 메시지 삭제
- `_startEdit()` — 인라인 편집 + 이후 메시지 제거 + LLM 재생성

### P4-1: 다국어 UI (PR #31, WAITING_PR)
- `src/i18n/i18n.service.js` 신규 — I18nService (t, setLang, applyToDOM)
- `src/i18n/locales/ko.js`, `en.js`, `ja.js` — 3개 언어팩
- `src/i18n/i18n.service.test.js` — 12 테스트 (키 일치 검증 포함)
- `src/boot.js` — i18n.applyToDOM() + 언어 선택기 init
- `index.html` — data-i18n 속성 + #lang-select 추가

---

## 🔜 다음 세션 시작점

**상태**: PR #27~#31 머지 대기  
**다음 할 일**: 모두 머지 후 Phase 5 착수 (보조 모델 시스템 / 커스텀 CSS)  
**주의사항**:
- PR들이 독립된 브랜치이므로 순서 무관하게 머지 가능
- P3-5(인스펙터)와 P3-6(기록 편집)은 chat.controller.js 수정 — 충돌 주의

---

## ❓ 미결 사항

- PR #27 (P3-3 프리셋), #28 (P3-4 소설가), #29 (P3-5 인스펙터),
  #30 (P3-6 기록편집), #31 (P4-1 다국어) — 모두 머지 대기
- 오늘 하루에 5개 PR 생성 완료. 모두 독립 브랜치로 충돌 최소화됨.

---

## 📊 테스트 현황

```
총 139 테스트 (최신 기준, 브랜치별 누적):
├── src/utils/markdown.test.js              5개
├── src/memory/cache.manager.test.js        8개
├── src/llm/providers/base-provider.test.js 12개
├── src/llm/llm.service.test.js             20개
├── src/llm/prompt-config.service.test.js   19개
├── src/llm/preset.service.test.js          15개  ← P3-3
├── src/chat/mode.service.test.js           18개  ← P3-4 (6 추가)
├── src/persona/character.service.test.js   31개
├── src/persona/persona.service.test.js     20개
└── src/i18n/i18n.service.test.js           12개  ← P4-1
e2e/smoke.test.js                           1개
```
