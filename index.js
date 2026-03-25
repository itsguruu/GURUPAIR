import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Only import pair router
import pairRouter from './pair.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8000;

import('events').then(events => {
    events.EventEmitter.defaultMaxListeners = 500;
});

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(__dirname));

// Only use pair routes
app.use('/code', pairRouter);
app.use('/pair', pairRouter);

// HTML Pages - redirect QR to pair
app.get('/qr', (req, res) => {
    res.redirect('/pair');
});

app.get('/qrpage', (req, res) => {
    res.redirect('/pair');
});

// Main page
app.get('/', async (req, res) => {
    const mainHtmlPath = path.join(__dirname, 'main.html');
    if (require('fs').existsSync(mainHtmlPath)) {
        res.sendFile(mainHtmlPath);
    } else {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>GURU MD</title>
                <style>
                    body {
                        font-family: monospace;
                        background: #0a0c0f;
                        color: #00ff88;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                    }
                    .container { text-align: center; padding: 20px; }
                    a { color: #00ff88; text-decoration: none; }
                    input, button {
                        padding: 10px;
                        margin: 10px;
                        font-size: 16px;
                        background: #1a1e24;
                        border: 1px solid #00ff88;
                        color: #00ff88;
                        border-radius: 5px;
                    }
                    button { cursor: pointer; background: #00ff88; color: #000; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>⚡ GURU MD</h1>
                    <p>WhatsApp Bot Session Manager</p>
                    <input type="text" id="number" placeholder="Enter phone number (e.g., 1234567890)">
                    <button onclick="pair()">Get Pairing Code</button>
                    <div id="result" style="margin-top: 20px;"></div>
                    <br>
                    <small>Session will be sent to your WhatsApp as Base64 ID starting with GURU~</small>
                </div>
                <script>
                    async function pair() {
                        const number = document.getElementById('number').value;
                        if (!number) {
                            alert('Please enter phone number');
                            return;
                        }
                        document.getElementById('result').innerHTML = '<div class="loading">⏳ Requesting pairing code...</div>';
                        try {
                            const res = await fetch(\`/code?number=\${number}\`);
                            const data = await res.json();
                            if (data.code) {
                                document.getElementById('result').innerHTML = \`✅ Pairing code: <strong>\${data.code}</strong><br>Check your WhatsApp for session ID\`;
                            } else if (data.error) {
                                document.getElementById('result').innerHTML = \`❌ Error: \${data.error}\`;
                            }
                        } catch (e) {
                            document.getElementById('result').innerHTML = '❌ Connection error';
                        }
                    }
                </script>
            </body>
            </html>
        `);
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        sessionType: 'Base64',
        botName: 'GURU MD',
        platform: process.env.VERCEL ? 'Vercel' : 'Local',
        note: 'QR disabled - use pairing code'
    });
});

// Vercel export
if (process.env.VERCEL) {
    export default app;
} else {
    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════╗
║     GURU MD - WhatsApp Pairing Server             ║
║     Session Type: Base64 (No Pastebin)            ║
╚═══════════════════════════════════════════════════╝
        `);
        console.log(`📱 Pairing Server Running on: http://localhost:${PORT}`);
        console.log(`🔗 Pairing Code Method: http://localhost:${PORT}/code?number=1234567890`);
        console.log(`✅ Health Check: http://localhost:${PORT}/health`);
    });
}

export default app;
