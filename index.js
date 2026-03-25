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

// Increase event listeners for Vercel
import('events').then(events => {
    events.EventEmitter.defaultMaxListeners = 500;
});

// Configure body parser with limits for Vercel
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files - check if public folder exists, otherwise use root
const staticPath = path.join(__dirname, 'public');
const hasPublicFolder = require('fs').existsSync(staticPath);
app.use(express.static(hasPublicFolder ? staticPath : __dirname));

// Routes
app.use('/qr', qrRouter);
app.use('/code', pairRouter);

// HTML Pages - Check both public and root directories
const sendHtmlFile = (res, filename) => {
    const publicPath = path.join(__dirname, 'public', filename);
    const rootPath = path.join(__dirname, filename);
    
    if (require('fs').existsSync(publicPath)) {
        res.sendFile(publicPath);
    } else {
        res.sendFile(rootPath);
    }
};

app.use('/pair', async (req, res) => {
    sendHtmlFile(res, 'pair.html');
});

app.use('/qrpage', (req, res) => {
    sendHtmlFile(res, 'qr.html');
});

app.use('/', async (req, res) => {
    sendHtmlFile(res, 'main.html');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        sessionType: 'Base64',
        botName: 'GURU MD',
        platform: process.env.VERCEL ? 'Vercel' : 'Local',
        version: '2.0.0'
    });
});

// Vercel requires the app to be exported as a serverless function
// This works for both local development and Vercel deployment
if (process.env.VERCEL) {
    // Export for Vercel serverless
    export default app;
} else {
    // Start server for local development
    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════╗
║     GURU MD - WhatsApp Pairing Server             ║
║     Session Type: Base64 (No Pastebin)            ║
║     Platform: ${process.env.VERCEL ? 'Vercel' : 'Local'}                        ║
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
}

export default app;
