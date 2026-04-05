/**
 * Chat Mode Service
 * Manages the active conversation mode (chat / roleplay).
 * Provides the roleplay-specific system prompt injection text.
 */

export const CHAT_MODES = {
    CHAT: 'chat',
    ROLEPLAY: 'roleplay'
};

export class ModeService {
    constructor() {
        this._mode = CHAT_MODES.CHAT;
    }

    get mode() {
        return this._mode;
    }

    get isRoleplay() {
        return this._mode === CHAT_MODES.ROLEPLAY;
    }

    /**
     * Switch the active mode.
     * @param {string} mode - one of CHAT_MODES values
     */
    setMode(mode) {
        if (!Object.values(CHAT_MODES).includes(mode)) return;
        this._mode = mode;
    }

    /**
     * Build the roleplay format hint injected into the system prompt.
     * @param {string} characterName
     * @returns {string}
     */
    getRoleplayHint(characterName) {
        const name = characterName || '캐릭터';
        return [
            '[롤플레잉 모드]',
            `지금부터 우리는 롤플레잉을 진행합니다. 당신은 "${name}"을(를) 연기합니다.`,
            '유저는 자신의 페르소나로서 행동하거나 대화합니다.',
            '행동은 *이탤릭체* 또는 「행동 묘사」 형식으로 표현될 수 있습니다.',
            '세계관에 완전히 몰입하여 자연스럽고 생동감 있는 응답을 해주세요.',
        ].join('\n');
    }
}

export const modeService = new ModeService();
