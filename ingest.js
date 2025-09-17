// src/ingest.js
import { pineconeIndex, genAI } from './src/config.js';
import { fetchNewsArticles } from './src/dataFetcher.js';

const BATCH_SIZE = 10;
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const ingestData = async () => {
    console.log('Starting ingestion process with Google Embeddings...');
    
    const articles = await fetchNewsArticles('http://rss.cnn.com/rss/cnn_topstories.rss');
    if (!articles || articles.length === 0) {
        console.log("No articles fetched. Exiting ingestion.");
        return;
    }

    for (let i = 0; i < articles.length; i += BATCH_SIZE) {
        const batch = articles.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch starting at index ${i}...`);

        // --- THE FIX IS HERE ---
        // First, filter the batch to only include articles that have content.
        const articlesWithContent = batch.filter(article => article.contentSnippet && article.contentSnippet.trim() !== '');

        if (articlesWithContent.length === 0) {
            console.log("Skipping batch because it contains no articles with content.");
            continue;
        }

        try {
            // Now, get the texts from this clean list.
            const texts = articlesWithContent.map(article => article.contentSnippet);

            // Generate embeddings for the batch.
            const result = await embeddingModel.batchEmbedContents({
                requests: texts.map(text => ({ content: { parts: [{ text }], role: "user" } })),
            });
            const batchEmbeddings = result.embeddings.map(e => e.values);

            // Prepare vectors using the clean list, ensuring all arrays are in sync.
            const vectors = articlesWithContent.map((article, index) => ({
                id: article.guid || article.link, // Use link as a fallback for a unique ID
                values: batchEmbeddings[index],
                metadata: {
                    text: article.contentSnippet,
                    title: article.title,
                    link: article.link
                }
            }));

            // Upsert the batch to Pinecone.
            await pineconeIndex.upsert(vectors);
            console.log(`SUCCESS: Upserted batch of ${vectors.length} articles.`);

        } catch (error) {
            console.error(`Error processing batch starting at index ${i}:`, error.message);
        }
        
        await delay(1000); // Wait for 1 second to respect rate limits.
    }

    console.log(`Ingestion complete. ${articles.length} articles processed.`);
};

ingestData();