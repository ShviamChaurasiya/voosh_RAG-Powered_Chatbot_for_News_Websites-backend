// src/sessionService.js
import { v4 as uuidv4 } from 'uuid';
import { redis } from './config.js';

/**
 * Generates a new unique session ID.
 * @returns {string} A new UUID.
 */
export function createSession() {
    return uuidv4();
}

/**
 * Retrieves the chat history for a given session ID from Redis.
 * @param {string} sessionId - The ID of the session.
 * @returns {Promise<Array>} A promise that resolves to the chat history array.
 */
export async function getChatHistory(sessionId) {
    const historyKey = `chat:${sessionId}`;
    // The Upstash client automatically parses the JSON, so we just return the data directly.
    const data = await redis.get(historyKey);
    return data ? data : []; // THE FIX IS HERE: Removed JSON.parse()
}

/**
 * Updates the chat history for a given session ID in Redis.
 * @param {string} sessionId - The ID of the session.
 * @param {Array} history - The chat history array to save.
 */
export async function updateChatHistory(sessionId, history) {
    const historyKey = `chat:${sessionId}`;
    // We still need to stringify when we write to Redis.
    await redis.set(historyKey, JSON.stringify(history));
}

/**
 * Clears the chat history for a given session ID from Redis.
 * @param {string} sessionId - The ID of the session.
 */
export async function clearSessionHistory(sessionId) {
    const historyKey = `chat:${sessionId}`;
    await redis.del(historyKey);
}