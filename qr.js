import express from 'express';

const router = express.Router();

// Simple placeholder QR page
router.get('/', async (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>GURU MD - QR Scanner</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #0a0c0f 0%, #0f1115 100%);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    background: rgba(18, 22, 28, 0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    padding: 40px;
                    text-align: center;
                    max-width: 500px;
                    width: 100%;
                    border: 1px solid rgba(0, 255, 136, 0.2);
                }
                h1 {
                    color: #00ff88;
                    margin-bottom: 20px;
                }
                .message {
                    color: rgba(255,255,255,0.8);
                    margin: 20px 0;
                    line-height: 1.6;
                }
                .btn {
                    display: inline-block;
                    background: linear-gradient(135deg, #00ff88 0%, #00c3ff 100%);
                    color: #000;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 30px;
                    font-weight: bold;
                    margin-top: 20px;
                }
                .note {
                    color: rgba(255,255,255,0.5);
                    font-size: 12px;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>⚡ GURU MD</h1>
                <div class="message">
                    <p>QR Code method is currently disabled.</p>
                    <p>Please use the <strong>Pairing Code</strong> method instead:</p>
                    <p style="color: #00ff88;">/pair?number=1234567890</p>
                </div>
                <a href="/pair" class="btn">Go to Pairing Page</a>
                <div class="note">
                    Note: QR method requires persistent WebSocket connections<br>
                    which are limited on serverless platforms.
                </div>
            </div>
        </body>
        </html>
    `);
});

// Vercel handler
export default async function handler(req, res) {
    return router(req, res);
}
