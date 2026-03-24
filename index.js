import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import qrRouter from './qr.js';
import pairRouter from './pair.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8000;

import('events').then(events => {
    events.EventEmitter.defaultMaxListeners = 500;
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Routes
app.use('/qr', qrRouter);
app.use('/code', pairRouter);

// HTML Pages
app.use('/pair', async (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});

app.use('/qrpage', (req, res) => {
    res.sendFile(path.join(__dirname, 'qr.html'));
});

app.use('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
});

// Health check endpoint (useful for deployment platforms)
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        sessionType: 'Base64',
        botName: 'GURU MD'
    });
});

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║     GURU MD - WhatsApp Pairing Server             ║
║     Session Type: Base64 (No Pastebin)            ║
╚═══════════════════════════════════════════════════╝
    `);
    console.log(`📱 Pairing Server Running on: http://localhost:${PORT}`);
    console.log(`🔗 QR Code Method: http://localhost:${PORT}/qrpage`);
    console.log(`🔗 Pairing Code Method: http://localhost:${PORT}/pair`);
    console.log(`✅ Health Check: http://localhost:${PORT}/health`);
    console.log(`
⭐ Support GURU MD:
   GitHub: https://github.com/itsguruu/GURUPAIR
   Telegram: https://t.me/itsguruu
    `);
});

export default app;
