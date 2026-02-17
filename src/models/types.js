/**
 * @typedef {Object} Persona
 * @property {string} id - Unique ID (UUID or Drive File ID)
 * @property {string} name - User's display name
 * @property {string} description - Description of the user persona
 * @property {string} [avatar] - Google Drive File ID of the avatar image
 * @property {string} createdAt - ISO Date string
 * @property {string} updatedAt - ISO Date string
 */

/**
 * @typedef {Object} LorebookEntry
 * @property {string} id - Unique ID
 * @property {string[]} keys - Keywords to trigger this entry
 * @property {string} content - The actual lore content
 * @property {boolean} enabled - Whether this entry is active
 */

/**
 * @typedef {Object} Character
 * @property {string} id - Unique ID (UUID or Drive File ID)
 * @property {string} name - Character name
 * @property {string} description - Short description
 * @property {string} personality - Detailed personality description
 * @property {string} firstMessage - Initial message from the character
 * @property {string} [avatar] - Google Drive File ID of the avatar image
 * @property {LorebookEntry[]} lorebook - Embedded lorebook entries
 * @property {string} createdAt - ISO Date string
 * @property {string} updatedAt - ISO Date string
 */

/**
 * @typedef {Object} Message
 * @property {string} role - 'user' | 'model' | 'system'
 * @property {string} content - The message content
 * @property {string} [timestamp] - ISO Date string
 */

/**
 * @typedef {Object} Session
 * @property {string} id - Unique ID (UUID or Drive File ID)
 * @property {string} characterId - ID of the character this session is with
 * @property {string} personaId - ID of the user persona used
 * @property {Message[]} messages - Chat history
 * @property {string} createdAt - ISO Date string
 * @property {string} updatedAt - ISO Date string
 */

/**
 * @typedef {Object} Preset
 * @property {string} id - Unique ID (UUID or Drive File ID)
 * @property {string} name - Preset name (e.g., "Creative Writing", "Roleplay")
 * @property {string} description - Description of what this preset is good for
 * @property {number} temperature - Randomness (0.0 - 2.0)
 * @property {number} topK - Top K sampling
 * @property {number} topP - Top P sampling
 * @property {number} maxOutputTokens - Max tokens to generate
 * @property {string[]} [stopSequences] - Sequences to stop generation
 * @property {string} createdAt - ISO Date string
 * @property {string} updatedAt - ISO Date string
 */

export const Types = {}; // Empty export to make this a module
