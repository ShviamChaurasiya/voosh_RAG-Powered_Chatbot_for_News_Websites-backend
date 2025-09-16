// index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getQueryResponse } from './src/ragService.js';
import { createSession, getChatHistory, updateChatHistory, clearSessionHistory } from './src/sessionService.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/session/new', (req, res) => {
    const sessionId = createSession();
    res.json({ sessionId });
});

app.post('/api/chat', async (req, res) => {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
        return res.status(400).json({ error: 'sessionId and message are required' });
    }

    try {
        const botResponse = await getQueryResponse(message);
        const history = await getChatHistory(sessionId);

        // Use a consistent message format
        history.push({ sender: 'user', text: message });
        history.push({ sender: 'bot', text: botResponse });

        await updateChatHistory(sessionId, history);

        res.json({ response: botResponse });
    } catch (error) {
        console.error('Error in /api/chat endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/history/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    try {
        const history = await getChatHistory(sessionId);
        res.json(history);
    } catch (error) {
        console.error('Error in /api/history endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/session/clear', async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
    }
    try {
        await clearSessionHistory(sessionId);
        res.json({ message: 'Session cleared successfully.' });
    } catch (error) {
        console.error('Error in /api/session/clear endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});