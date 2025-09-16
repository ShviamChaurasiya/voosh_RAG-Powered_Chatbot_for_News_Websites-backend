# RAG-Powered News Chatbot - Backend

This project is the backend service for a simple full-stack chatbot, created as an assignment for the Full Stack Developer role at Voosh. It implements a Retrieval-Augmented Generation (RAG) pipeline to answer user queries based on a corpus of news articles.

## Tech Stack Used

* **Runtime:** Node.js
* **Framework:** Express.js
* **LLM & Embeddings:** Google Gemini API (`gemini-1.5-flash-latest` for generation, `embedding-001` for embeddings)
* **Vector Database:** Pinecone (Serverless)
* **Cache & Session Storage:** Upstash Redis
* **Dependencies:**
    * `@google/generative-ai`: For interacting with the Gemini API.
    * `@pinecone-database/pinecone`: Pinecone SDK for vector storage and retrieval.
    * `@upstash/redis`: For connecting to the Redis database.
    * `rss-parser`: For ingesting news articles from an RSS feed.
    * `dotenv`: For managing environment variables.
    * `uuid`: For generating unique session IDs.

## System Design & End-to-End Flow

The system is designed around a classic RAG pipeline, separated into a one-time ingestion process and a real-time query process.

### 1. Data Ingestion (`ingest.js`)

This is a one-time script used to populate the vector database.
1.  **Fetch Articles:** It fetches approximately 30-50 recent news articles from a public RSS feed (e.g., BBC News).
2.  **Generate Embeddings:** Each article's content is sent to the Google `embedding-001` model to be converted into a 768-dimension vector.
3.  **Store Vectors:** The generated vectors, along with their original text as metadata, are "upserted" into a Pinecone index for efficient similarity searching.

### 2. Live Chat Flow (`index.js` & Services)

This is the real-time process that occurs for every user message.
1.  A user sends a message to the `/api/chat` endpoint.
2.  The user's query is sent to the Google `embedding-001` model to create a query vector.
3.  This query vector is used to search the Pinecone index, retrieving the top-k (e.g., top 3) most semantically similar news article snippets. This is the "Retrieval" step.
4.  The original user query and the retrieved article snippets (the "context") are combined into a detailed prompt.
5.  This prompt is sent to the Google Gemini (`gemini-1.5-flash-latest`) model, which generates a final, context-aware answer. This is the "Augmented Generation" step.

## File Structure

```
.
├── .env                # Environment variables (must be created manually)
├── package.json        # Project dependencies and scripts
├── Readme.md           # This file
└── src/
    ├── config.js       # Initializes and configures clients (Pinecone, Gemini, Redis)
    ├── dataFetcher.js  # Fetches and parses news articles from an RSS feed
    ├── index.js        # The main Express API server and entry point
    ├── ingest.js       # Standalone script for data ingestion into Pinecone
    ├── ragService.js   # Core RAG logic for generating query responses
    └── sessionService.js # Handles session creation and chat history in Redis
```

## Redis Caching & Session Management

Session management and caching are handled by an in-memory Redis database to ensure fast response times for conversations.

* **Session Creation:** When a new user starts a session, a unique session ID (UUID) is generated via the `/api/session/new` endpoint.
* **History Storage:** The entire conversation history for a session (an array of user and bot messages) is stored as a single JSON string in Redis. The session ID is used as the key (e.g., `chat:<session-id>`). This allows for stateful conversations.
* **TTL (Time-To-Live) Configuration:** For a production environment, it would be wise to set an expiry on session keys to automatically clean up old, inactive conversations and manage memory. This can be done by adding a TTL option when setting the data in Redis. For example:
    ```javascript
    // Example of setting a key with a 1-hour expiry (3600 seconds)
    await redis.set(historyKey, dataToStore, { ex: 3600 });
    ```

## API Endpoints

The server exposes the following REST API endpoints:

| Method | Route                    | Description                                                                 | Request Body                  | Response Body                      |
| :----- | :----------------------- | :-------------------------------------------------------------------------- | :---------------------------- | :--------------------------------- |
| `GET`  | `/api/session/new`       | Creates a new, unique session ID for a user.                                | `None`                        | `{ "sessionId": "..." }`           |
| `POST` | `/api/chat`              | Submits a user message, gets a bot response, and updates the history.       | `{ "sessionId": "...", "message": "..." }` | `{ "response": "..." }`            |
| `GET`  | `/api/history/:sessionId`| Retrieves the full conversation history for a given session.                | `None`                        | `[{ "role": "...", "content": "..." }]` |
| `POST` | `/api/session/clear`     | Deletes the conversation history for a given session.                       | `{ "sessionId": "..." }`      | `{ "message": "Session cleared" }` |


## Setup & Running Locally

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file** in the root directory and populate it with your API keys:
    ```env
    # Google Gemini
    GEMINI_API_KEY="..."

    # Pinecone
    PINECONE_API_KEY="..."
    PINECONE_INDEX_NAME="..."

    # Upstash Redis
    UPSTASH_REDIS_REST_URL="..."
    UPSTASH_REDIS_REST_TOKEN="..."
    ```
4.  **Populate the Vector Database:** Run the one-time ingestion script.
    ```bash
    node src/ingest.js
    ```
5.  **Start the server:**
    ```bash
    node src/index.js
    ```
    The server will be running on `http://localhost:3001`.

## Potential Improvements

* **Automatic Daily Ingestion:** A future improvement would be to configure a daily scheduled job (cron job) that runs the ingestion script to fetch the latest articles, checks for duplicates against Pinecone, and stores only the new ones. This would keep the chatbot's knowledge base current.
* **SQL Database for Long-Term Storage:** For long-term persistence and analytics, the final conversation transcripts could be saved to a SQL database like PostgreSQL.

---

## ⚠️ Important Note for Developers

There appears to be an issue in the current implementation. The files `src/ragService.js` and `src/ingest.js` attempt to import an `embeddings` object from `src/config.js` to generate vector embeddings. However, `src/config.js` does not configure or export this object.

To fix this, you will likely need to create and export an embedding model instance in `config.js`, potentially using the `@google/generative-ai` package, and then import it correctly in the other files.