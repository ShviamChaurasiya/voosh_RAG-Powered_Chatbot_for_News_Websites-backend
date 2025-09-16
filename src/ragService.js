// src/ragService.js
import { pineconeIndex, genAI } from './config.js';

// Get the Google embedding model
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

// Get the Gemini chat model
const chatModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

export async function getQueryResponse(query) {
    console.log("Embedding user query with Google:", query);

    // 1. Embed the user's query using Google's model
    const result = await embeddingModel.embedContent(query);
    const queryEmbedding = result.embedding.values;

    // 2. Retrieve context from Pinecone
    const queryResult = await pineconeIndex.query({
        topK: 3,
        vector: queryEmbedding,
        includeMetadata: true,
    });
    
    const context = queryResult.matches
        .map(match => match.metadata.text)
        .join("\n---\n");

    // 3. Generate a prompt for Gemini
    const prompt = `Based on the following news articles as context:\n${context}\n\nPlease provide a comprehensive answer for this question: "${query}"`;
    
    // 4. Call the LLM to get the final answer
    const chatResult = await chatModel.generateContent(prompt);
    const response = await chatResult.response;
    const text = response.text();

    console.log("Generated response successfully.");
    return text;
}