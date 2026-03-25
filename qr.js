import express from 'express';
import fs from 'fs-extra';
import pino from 'pino';
import QRCode from 'qrcode';
import {
    makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser,
    fetchLatestBaileysVersion,
    DisconnectReason
} from '@whiskeysockets/baileys';

const router = express.Router();
const MAX_RECONNECT_ATTEMPTS = 3;
const SESSION_TIMEOUT = 5 * 60 * 1000;
const CLEANUP_DELAY = 5000;

// Use /tmp for Vercel compatibility
const getAuthPath = (sessionId) => {
    const basePath = process.env.VERCEL ? '/tmp/auth_info_baileys' : './auth_info_baileys';
    return `${basePath}/session_${sessionId}`;
};

const MESSAGE = `
*SESSION GENERATED SUCCESSFULLY* ✅

*Gɪᴠᴇ ᴀ ꜱᴛᴀʀ ᴛᴏ ʀᴇᴘᴏ ꜰᴏʀ ᴄᴏᴜʀᴀɢᴇ* 🌟
https://github.com/itsguruu/GURUPAIR

*Sᴜᴘᴘᴏʀᴛ Gʀᴏᴜᴘ ꜰᴏʀ ϙᴜᴇʀʏ* 💭
https://t.me/itsguruu

*Yᴏᴜ-ᴛᴜʙᴇ ᴛᴜᴛᴏʀɪᴀʟꜱ* 🪄 
https://youtube.com/@itsguruu

*GURU MD - WHATSAPP BOT* 🥀
`;

// Generate Base64 Session ID
function generateBase64Session(credsData, botName = 'GURU') {
    try {
        const base64String = Buffer.from(JSON.stringify(credsData)).toString('base64');
        const sessionId = `${botName}~${base64String}`;
        return sessionId;
    } catch (error) {
        console.error('Error generating Base64 session:', error);
        throw error;
    }
}

async function removeFile(FilePath) {
    try {
        if (!fs.existsSync(FilePath)) return false;
        await fs.remove(FilePath);
        return true;
    } catch (e) {
        console.error('Error removing file:', e);
        return false;
    }
}

router.get('/', async (req, res) => {
    const sessionId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const dirs = getAuthPath(sessionId);
    
    let qrGenerated = false;
    let sessionCompleted = false;
    let isCleaningUp = false;
    let responseSent = false;
    let reconnectAttempts = 0;
    let currentSocket = null;
    let timeoutHandle = null;

    async function cleanup(reason = 'unknown') {
        if (isCleaningUp) return;
        isCleaningUp = true;

        console.log(`🧹 Cleaning up session ${sessionId} - Reason: ${reason}`);

        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
            timeoutHandle = null;
        }

        if (currentSocket) {
            try {
                currentSocket.ev.removeAllListeners();
                await currentSocket.end();
            } catch (e) {
                console.error('Error closing socket:', e);
            }
            currentSocket = null;
        }

        setTimeout(async () => {
            await removeFile(dirs);
        }, CLEANUP_DELAY);
    }

    async function initiateSession() {
        if (sessionCompleted || isCleaningUp) {
            console.log('⚠️ Session already completed or cleaning up');
            return;
        }

        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log(`❌ Max reconnection attempts reached`);
            if (!responseSent && !res.headersSent) {
                responseSent = true;
                res.status(503).json({ error: 'Connection failed after multiple attempts' });
            }
            await cleanup('max_reconnects');
            return;
        }

        try {
            await fs.ensureDir(dirs);

            const { state, saveCreds } = await useMultiFileAuthState(dirs);
            const { version } = await fetchLatestBaileysVersion();

            if (currentSocket) {
                try {
                    currentSocket.ev.removeAllListeners();
                    await currentSocket.end();
                } catch (e) {}
            }

            currentSocket = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: true,
                logger: pino({ level: "silent" }),
                browser: Browsers.macOS('Chrome'),
                markOnlineOnConnect: false,
                generateHighQualityLinkPreview: false,
            });

            const sock = currentSocket;

            // Handle QR Code
            sock.ev.on('connection.update', async (update) => {
                if (isCleaningUp) return;

                const { qr, connection, lastDisconnect, isNewLogin } = update;

                // Send QR code to client
                if (qr && !qrGenerated && !responseSent) {
                    qrGenerated = true;
                    try {
                        const qrImage = await QRCode.toDataURL(qr);
                        if (!responseSent && !res.headersSent) {
                            responseSent = true;
                            res.send(`
                                <!DOCTYPE html>
                                <html>
                                <head>
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
                                            padding: 30px;
                                            text-align: center;
                                            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                                            border: 1px solid rgba(0, 255, 136, 0.2);
                                            max-width: 400px;
                                            width: 100%;
                                        }
                                        h1 {
                                            color: #00ff88;
                                            margin-bottom: 10px;
                                            font-size: 24px;
                                        }
                                        .qr-container {
                                            margin: 20px 0;
                                            padding: 20px;
                                            background: white;
                                            border-radius: 15px;
                                            display: inline-block;
                                        }
                                        img {
                                            width: 250px;
                                            height: 250px;
                                        }
                                        p {
                                            color: rgba(255, 255, 255, 0.7);
                                            margin: 10px 0;
                                        }
                                        .status {
                                            color: #00ff88;
                                            font-weight: bold;
                                            margin-top: 15px;
                                        }
                                        .loading {
                                            display: inline-block;
                                            width: 20px;
                                            height: 20px;
                                            border: 2px solid rgba(0, 255, 136, 0.3);
                                            border-top-color: #00ff88;
                                            border-radius: 50%;
                                            animation: spin 1s linear infinite;
                                        }
                                        @keyframes spin {
                                            to { transform: rotate(360deg); }
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <h1>⚡ GURU MD</h1>
                                        <p>Scan QR Code with WhatsApp</p>
                                        <div class="qr-container">
                                            <img src="${qrImage}" alt="QR Code">
                                        </div>
                                        <p class="status">🟢 Waiting for connection...</p>
                                        <p style="font-size: 12px;">Open WhatsApp → Settings → Linked Devices → Link a Device</p>
                                        <div class="loading"></div>
                                    </div>
                                    <script>
                                        setTimeout(() => {
                                            fetch('/health').then(() => {
                                                // Keep connection alive
                                            });
                                        }, 5000);
                                    </script>
                                </body>
                                </html>
                            `);
                            console.log('✅ QR Code generated and sent to client');
                        }
                    } catch (err) {
                        console.error('Error generating QR code:', err);
                    }
                }

                if (connection === 'open') {
                    if (sessionCompleted) return;
                    sessionCompleted = true;

                    try {
                        const credsFile = `${dirs}/creds.json`;
                        if (await fs.pathExists(credsFile)) {
                            console.log(`📄 Reading creds.json...`);
                            
                            const credsData = await fs.readJson(credsFile);
                            const generatedSessionId = generateBase64Session(credsData, 'GURU');
                            
                            console.log('✅ Base64 Session ID generated successfully!');
                            
                            // Send session ID to WhatsApp
                            if (sock.user) {
                                const userJid = jidNormalizedUser(sock.user.id);
                                const sessionMessage = `*✨ GURU MD SESSION GENERATED ✨*

*Your Session ID:* 
\`${generatedSessionId}\`

*⚠️ IMPORTANT:*
1. Copy the complete session ID above
2. Add it to your environment variables as SESSION_ID
3. Restart your bot

${MESSAGE}`;
                                
                                await sock.sendMessage(userJid, { text: sessionMessage });
                                console.log(`✅ Session ID sent to WhatsApp`);
                            }
                        }
                    } catch (err) {
                        console.error('Error generating/sending Base64 session:', err);
                    } finally {
                        await cleanup('session_complete');
                    }
                }

                if (isNewLogin) {
                    console.log(`🔐 New login via QR code`);
                }

                if (connection === 'close') {
                    if (sessionCompleted || isCleaningUp) {
                        console.log('✅ Session completed, not reconnecting');
                        await cleanup('already_complete');
                        return;
                    }

                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    
                    if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                        console.log(`❌ Logged out`);
                        await cleanup('logged_out');
                    } else if (qrGenerated && !sessionCompleted) {
                        reconnectAttempts++;
                        console.log(`🔁 Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
                        await delay(2000);
                        await initiateSession();
                    } else {
                        await cleanup('connection_closed');
                    }
                }
            });

            sock.ev.on('creds.update', saveCreds);

            timeoutHandle = setTimeout(async () => {
                if (!sessionCompleted && !isCleaningUp) {
                    console.log(`⏰ Session timeout`);
                    if (!responseSent && !res.headersSent) {
                        responseSent = true;
                        res.status(408).json({ error: 'Session timeout' });
                    }
                    await cleanup('timeout');
                }
            }, SESSION_TIMEOUT);

        } catch (err) {
            console.error(`❌ Error initializing session:`, err);
            if (!responseSent && !res.headersSent) {
                responseSent = true;
                res.status(503).json({ error: 'Service Unavailable' });
            }
            await cleanup('init_error');
        }
    }

    await initiateSession();
});

// Vercel handler
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    return new Promise((resolve, reject) => {
        router(req, res, (err) => {
            if (err) reject(err);
            resolve();
        });
    });
}
