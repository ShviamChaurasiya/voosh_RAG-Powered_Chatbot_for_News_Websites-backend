// src/ingest.js
import { pineconeIndex, genAI } from './src/config.js';
import { fetchNewsArticles } from './src/dataFetcher.js';

const BATCH_SIZE = 10;
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const ingestData = async () => {
    console.log('Starting ingestion process with Google Embeddings...');
    
    // const articles = await fetchNewsArticles('https://feeds.bbci.co.uk/news/rss.xml?edition=int');
    const articles = await fetchNewsArticles('http://rss.cnn.com/rss/cnn_topstories.rss');
    if (!articles || articles.length === 0) {
        console.log("No articles fetched. Exiting ingestion.");
        return;
    }

    for (let i = 0; i < articles.length; i += BATCH_SIZE) {
        const batchArticles = articles.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch starting at index ${i}...`);

        const texts = batchArticles.map(article => article.contentSnippet).filter(Boolean);
        if (texts.length === 0) {
            console.log("Skipping empty batch.");
            continue;
        }

        try {
            // FIX #1: Correctly format the content for the Google API
            const requests = texts.map(text => ({
                content: {
                    parts: [{ text }],
                    role: "user" // Role is required for content structure
                }
            }));

            const result = await embeddingModel.batchEmbedContents({ requests });
            const batchEmbeddings = result.embeddings.map(e => e.values);

            const vectors = batchArticles.map((article, index) => ({
                id: article.guid,
                values: batchEmbeddings[index],
                metadata: {
                    text: article.contentSnippet,
                    title: article.title,
                    link: article.link
                }
            }));

            await pineconeIndex.upsert(vectors);
            console.log(`SUCCESS: Upserted batch of ${vectors.length} articles.`);

        } catch (error) {
            console.error(`Error processing batch starting at index ${i}:`, error.message);
        }
        
        // FIX #2: Add a delay to avoid rate limiting
        await delay(1000); // Wait for 1 second before the next batch
    }

    console.log(`Ingestion complete. ${articles.length} articles processed.`);
};

ingestData();