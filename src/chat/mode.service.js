/**
 * Chat Mode Service
 * Manages the active conversation mode (chat / roleplay).
 * Provides the roleplay-specific system prompt injection text.
 */

export const CHAT_MODES = {
    CHAT: 'chat',
    ROLEPLAY: 'roleplay',
    NOVELIST: 'novelist'
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

    get isNovelist() {
        return this._mode === CHAT_MODES.NOVELIST;
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

    /**
     * Build the novelist mode hint injected into the system prompt.
     * @param {string} characterName
     * @returns {string}
     */
    getNovelistHint(characterName) {
        const name = characterName || '캐릭터';
        return [
            '[소설가 모드]',
            `지금부터 우리는 릴레이 소설을 함께 씁니다. 당신은 "${name}"의 시점에서 이야기를 이어갑니다.`,
            '유저가 입력한 내용을 플롯 제안 또는 다음 장면의 방향으로 해석하고,',
            '소설적 문체(묘사, 내면 독백, 대화 등)로 풍부하게 이어 써주세요.',
            '각 응답은 독립적인 단락이나 장면으로 완결성을 갖추어야 합니다.',
            '이야기의 흐름과 캐릭터의 일관성을 유지해주세요.',
        ].join('\n');
    }
}

export const modeService = new ModeService();
