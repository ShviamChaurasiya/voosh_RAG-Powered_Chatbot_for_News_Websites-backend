// src/dataFetcher.js
import Parser from 'rss-parser';

/**
 * Fetches and parses articles from a given RSS feed URL.
 * @param {string} feedUrl - The URL of the RSS feed.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of article objects.
 */
export const fetchNewsArticles = async (feedUrl) => {
    console.log(`Fetching articles from: ${feedUrl}`);
    try {
        const parser = new Parser();
        const feed = await parser.parseURL(feedUrl);
        // We will limit to 50 articles as per the assignment requirement
        const articles = feed.items.slice(0, 50);
        console.log(`Successfully fetched ${articles.length} articles.`);
        return articles;
    } catch (error) {
        console.error("Failed to fetch news articles:", error);
        return []; // Return an empty array on failure
    }
};