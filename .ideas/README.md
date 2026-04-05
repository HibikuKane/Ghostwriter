# .ideas/ — 기획 라우터

> **Living Document**: 이 폴더는 Ghostwriter의 기획·방향성을 담는 내부 문서 공간입니다.  
> 코드와 함께 살아 움직이며, 에이전트와 유저 모두가 읽고 씁니다.

---

## 📍 현재 위치

```
Phase 1:    ████████████████  100% ✅
Bridge:     ████████████████  100% ✅
Phase 1.5:  ████████████████  100% ✅
Phase 2:    ████████████████  100% ✅
Phase 3:    ████████████████  100% ✅
Phase 4:    ████████████████  100% ✅ ← 지금 여기
Phase 5:    ░░░░░░░░░░░░░░░░    0% ← 다음
```

**다음 목표**: Phase 5 — 보조 기능 & 폴리싱 (보조 모델 시스템 / 커스텀 CSS)  
→ 상세: [`current-status.md`](./current-status.md), [`roadmap.md`](./roadmap.md)

---

## 🧭 작업 유형별 읽을 파일

| 작업 유형 | 필수 | 선택 |
|-----------|------|------|
| **새 기능 설계 / Phase 시작** | `roadmap.md`, `technical-dependencies.md` | `features.md` |
| **특정 기능 상세 구현** | `features.md` (해당 항목) | `technical-dependencies.md` |
| **현재 진척 파악** | `current-status.md` | `roadmap.md` |
| **UX/UI 작업** | `ux-improvements.md` | `features.md` |
| **안정성·에러 처리 작업** | `flow-hardening.md` | `testing-strategy.md` |
| **테스트 전략 수립** | `testing-strategy.md` | — |
| **에이전트 협업 방법론 개선** | `claude-code-optimizing.md` | — |

> 모든 파일을 읽을 필요 없음. 작업에 맞는 파일만 골라서.

---

## 📂 파일 목록

| 파일 | 내용 |
|------|------|
| [`current-status.md`](./current-status.md) | 현재 구현 상태 및 진행률 스냅샷 |
| [`roadmap.md`](./roadmap.md) | Phase별 로드맵 및 기능 우선순위 |
| [`features.md`](./features.md) | 13가지 기능 상세 설명 |
| [`technical-dependencies.md`](./technical-dependencies.md) | 기능 간 의존성 그래프 및 구현 순서 |
| [`ux-improvements.md`](./ux-improvements.md) | 실사용 피드백 기반 UX 개선 목록 |
| [`flow-hardening.md`](./flow-hardening.md) | 안정성·에러처리 작업 내역 |
| [`testing-strategy.md`](./testing-strategy.md) | 테스트 자동화 전략 |
| [`claude-code-optimizing.md`](./claude-code-optimizing.md) | 에이전트 협업 방법론 |

---

## ✏️ 편집 권한

### 에이전트 (자유롭게 편집 가능)
- 기능 구현 완료 시 → `current-status.md` 해당 항목 체크
- Phase 전환 시 → `roadmap.md` + `current-status.md` 동시 업데이트
- 새 기술부채 발견 시 → `.agent/reference/tech-debt.md` 추가
- 기능 설계가 구현 중 바뀐 경우 → `features.md` 관련 항목 수정

### 에이전트 의무 — 다음 작업자를 위한 인계

작업 완료 후 관련 `.ideas/` 파일을 업데이트할 때, 해당 파일 하단 또는 관련 섹션에 아래 형식으로 한 단락을 추가한다:

```
> **[날짜] 작업 인계**: [무엇을 했는지 한 줄]. 
> 다음 작업자 주의사항: [다음 에이전트가 놓치기 쉬운 점 또는 이어받아야 할 컨텍스트].
```

### 유저 전용 결정 (에이전트 임의 변경 금지)
- Phase 순서 재조정
- 기능 우선순위 변경
- 로드맵에서 기능 추가/제거
- 이 README의 "현재 위치" 섹션 — Phase 전환 시 에이전트가 current-status.md와 함께 업데이트
