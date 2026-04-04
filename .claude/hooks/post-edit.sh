#!/bin/bash
# PostToolUse(Edit/Write) 훅 — src/*.js 변경 시 단위 테스트 자동 실행

FILE=$(node -e "const i=JSON.parse(process.env.CLAUDE_TOOL_INPUT||'{}'); console.log(i.file_path||i.new_file_path||'')")

if [[ "$FILE" == *.js ]] && [[ "$FILE" == *src/* || "$FILE" == *src\\* ]]; then
    echo ""
    echo "[훅] src/*.js 변경 감지: $FILE"
    echo "[훅] 단위 테스트 실행 중..."
    npm test -- --run 2>&1 | tail -20
fi
