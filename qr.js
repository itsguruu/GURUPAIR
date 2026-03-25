import express from 'express';

const router = express.Router();

// Simple redirect to pairing method
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
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
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
                    font-size: 28px;
                }
                .message {
                    color: rgba(255,255,255,0.8);
                    margin: 20px 0;
                    line-height: 1.6;
                    font-size: 16px;
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
                    transition: transform 0.2s;
                }
                .btn:hover {
                    transform: scale(1.05);
                }
                .note {
                    color: rgba(255,255,255,0.5);
                    font-size: 12px;
                    margin-top: 20px;
                }
                .code-example {
                    background: rgba(0,0,0,0.3);
                    padding: 10px;
                    border-radius: 8px;
                    font-family: monospace;
                    margin: 15px 0;
                    color: #00ff88;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>⚡ GURU MD</h1>
                <div class="message">
                    <p>QR Code method is currently disabled for Vercel deployment.</p>
                    <p>Please use the <strong style="color: #00ff88;">Pairing Code</strong> method instead:</p>
                    <div class="code-example">
                        /code?number=1234567890
                    </div>
                    <p>Replace 1234567890 with your WhatsApp number</p>
                </div>
                <a href="/pair" class="btn">Go to Pairing Page</a>
                <div class="note">
                    Note: QR method requires persistent WebSocket connections<br>
                    which are limited on serverless platforms like Vercel.
                </div>
            </div>
        </body>
        </html>
    `);
});

export default router;
