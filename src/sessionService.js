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
    const data = await redis.get(historyKey);
    return data ? data : [];
}

/**
 * Updates the chat history for a given session ID in Redis with a 60-second timeout.
 * @param {string} sessionId - The ID of the session.
 * @param {Array} history - The chat history array to save.
 */
export async function updateChatHistory(sessionId, history) {
    const historyKey = `chat:${sessionId}`;
    const dataToStore = JSON.stringify(history);

    // THE CHANGE IS HERE: We've added { ex: 60 } to the command.
    // This tells Redis to automatically delete this session key if it
    // isn't updated again within 60 seconds (TTL - Time To Live).
    await redis.set(historyKey, dataToStore, { ex: 60 });
}

/**
 * Clears the chat history for a given session ID from Redis.
 * @param {string} sessionId - The ID of the session.
 */
export async function clearSessionHistory(sessionId) {
    const historyKey = `chat:${sessionId}`;
    await redis.del(historyKey);
}