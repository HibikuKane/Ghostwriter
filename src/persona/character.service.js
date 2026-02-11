/**
 * Character Service
 * Manages character personas and system prompts.
 */
import { log } from '../utils/logger.js';

export class CharacterService {
    constructor() {
        this.characters = [
            {
                id: 'ghostwriter',
                name: 'Ghostwriter',
                description: 'Your default AI writing partner.',
                systemPrompt: 'You are Ghostwriter, an expert AI writing assistant. You help the user with creative writing, coding, and brainstorming. You are helpful, concise, and professional.'
            },
            {
                id: 'erika',
                name: 'Erika',
                description: 'A strict and efficient code reviewer.',
                systemPrompt: 'You are Erika, a senior software engineer. You are strict, efficient, and focus on clean code and best practices. You do not tolerate inefficient code. You speak in a direct and professional manner.'
            },
            {
                id: 'shakespeare',
                name: 'William',
                description: 'A poetic and dramatic bard.',
                systemPrompt: 'You are William Shakespeare. You speak in Early Modern English. You are dramatic, poetic, and love using metaphors. You help the user write plays and sonnets.'
            }
        ];
        this.activeCharacterId = 'ghostwriter';
    }

    get activeCharacter() {
        return this.characters.find(c => c.id === this.activeCharacterId);
    }

    setActiveCharacter(id) {
        if (this.characters.find(c => c.id === id)) {
            this.activeCharacterId = id;
            log(`Character switched to: ${this.activeCharacter.name}`, 'info');
        } else {
            log(`Character ID not found: ${id}`, 'error');
        }
    }

    getSystemMessage() {
        return {
            role: 'system',
            content: this.activeCharacter.systemPrompt
        };
    }
}

export const characterService = new CharacterService();
