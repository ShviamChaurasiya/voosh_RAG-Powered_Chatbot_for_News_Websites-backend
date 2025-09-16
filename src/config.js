// src/config.js
import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Redis } from '@upstash/redis';

// Initialize Pinecone Client (This is the updated part)
export const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT
});
export const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME);

// Initialize Google Generative AI (used for BOTH embeddings and chat)
export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Upstash Redis
export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});