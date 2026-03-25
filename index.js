import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Only import pair router, QR is optional
import pairRouter from './pair.js';

// Try to import QR, but handle if it doesn't exist
let qrRouter = null;
try {
    qrRouter = (await import('./qr.js')).default;
} catch (e) {
    console.log('QR module not found, QR routes disabled');
}

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
const staticPath = path.join(__dirname, 'public');
const hasPublicFolder = require('fs').existsSync(staticPath);
app.use(express.static(hasPublicFolder ? staticPath : __dirname));

// Routes - QR only if available
if (qrRouter) {
    app.use('/qr', qrRouter);
}
app.use('/code', pairRouter);

// HTML Pages
app.use('/pair', async (req, res) => {
    const pairHtmlPath = path.join(__dirname, 'pair.html');
    const publicPairPath = path.join(__dirname, 'public', 'pair.html');
    
    if (require('fs').existsSync(pairHtmlPath)) {
        res.sendFile(pairHtmlPath);
    } else if (require('fs').existsSync(publicPairPath)) {
        res.sendFile(publicPairPath);
    } else {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>GURU MD - Pairing</title>
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
                    .container {
                        text-align: center;
                        padding: 20px;
                    }
                    input, button {
                        padding: 10px;
                        margin: 10px;
                        font-size: 16px;
                    }
                    button {
                        background: #00ff88;
                        border: none;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>⚡ GURU MD Pairing</h1>
                    <input type="text" id="number" placeholder="Enter phone number">
                    <button onclick="pair()">Get Pairing Code</button>
                    <div id="result"></div>
                </div>
                <script>
                    async function pair() {
                        const number = document.getElementById('number').value;
                        const res = await fetch(\`/code?number=\${number}\`);
                        const data = await res.json();
                        document.getElementById('result').innerHTML = \`Code: \${data.code}\`;
                    }
                </script>
            </body>
            </html>
        `);
    }
});

app.use('/qrpage', (req, res) => {
    res.redirect('/pair');
});

app.use('/', async (req, res) => {
    const mainHtmlPath = path.join(__dirname, 'main.html');
    const publicMainPath = path.join(__dirname, 'public', 'main.html');
    
    if (require('fs').existsSync(mainHtmlPath)) {
        res.sendFile(mainHtmlPath);
    } else if (require('fs').existsSync(publicMainPath)) {
        res.sendFile(publicMainPath);
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
                    .container { text-align: center; }
                    a { color: #00ff88; text-decoration: none; margin: 10px; display: inline-block; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>⚡ GURU MD</h1>
                    <p>WhatsApp Bot Session Manager</p>
                    <a href="/pair">Get Pairing Code</a>
                    <br>
                    <small>Use: /pair?number=1234567890</small>
                </div>
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
        qrEnabled: !!qrRouter
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
        console.log(`🔗 Pairing Code Method: http://localhost:${PORT}/pair?number=1234567890`);
        console.log(`✅ Health Check: http://localhost:${PORT}/health`);
    });
}

export default app;
