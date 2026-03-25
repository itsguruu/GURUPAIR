import express from 'express';
import fs from 'fs-extra';
import pino from 'pino';
import pn from 'awesome-phonenumber';
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
    // Vercel uses /tmp directory for temporary storage
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

// Vercel-compatible handler
export default async function handler(req, res) {
    // Set CORS headers for Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    let num = req.query.number || req.body?.number;

    if (!num) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    num = num.replace(/[^0-9]/g, '');
    const phone = pn('+' + num);

    if (!phone.isValid()) {
        return res.status(400).json({ error: 'Invalid phone number. Use full international format without + or spaces.' });
    }

    num = phone.getNumber('e164').replace('+', '');

    const sessionId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const dirs = getAuthPath(sessionId);

    let pairingCodeSent = false;
    let sessionCompleted = false;
    let isCleaningUp = false;
    let responseSent = false;
    let reconnectAttempts = 0;
    let currentSocket = null;
    let timeoutHandle = null;

    async function cleanup(reason = 'unknown') {
        if (isCleaningUp) return;
        isCleaningUp = true;

        console.log(`🧹 Cleaning up session ${sessionId} (${num}) - Reason: ${reason}`);

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
            console.log(`❌ Max reconnection attempts reached for ${num}`);
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
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: Browsers.macOS('Chrome'),
                markOnlineOnConnect: false,
                generateHighQualityLinkPreview: false,
                defaultQueryTimeoutMs: 60000,
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 30000,
                retryRequestDelayMs: 250,
                maxRetries: 3,
            });

            const sock = currentSocket;

            sock.ev.on('connection.update', async (update) => {
                if (isCleaningUp) return;

                const { connection, lastDisconnect, isNewLogin } = update;

                if (connection === 'open') {
                    if (sessionCompleted) {
                        console.log('⚠️ Session already completed, skipping...');
                        return;
                    }
                    sessionCompleted = true;

                    try {
                        const credsFile = `${dirs}/creds.json`;
                        if (await fs.pathExists(credsFile)) {
                            console.log(`📄 Reading creds.json for ${num}...`);
                            
                            const credsData = await fs.readJson(credsFile);
                            const generatedSessionId = generateBase64Session(credsData, 'GURU');
                            
                            console.log('✅ Base64 Session ID generated successfully!');
                            console.log('📱 Session ID (starts with GURU~):', generatedSessionId.substring(0, 50) + '...');
                            
                            // Send via WhatsApp
                            const userJid = jidNormalizedUser(num + '@s.whatsapp.net');
                            
                            const sessionMessage = `*✨ GURU MD SESSION GENERATED ✨*

*Your Session ID:* 
\`${generatedSessionId}\`

*⚠️ IMPORTANT:*
1. Copy the complete session ID above
2. Add it to your environment variables as SESSION_ID
3. Restart your bot

*📝 Example:*
SESSION_ID=${generatedSessionId}

${MESSAGE}`;
                            
                            await sock.sendMessage(userJid, { text: sessionMessage });
                            console.log(`✅ Session ID sent to ${num}`);
                            
                            // Send success response to API
                            if (!responseSent && !res.headersSent) {
                                responseSent = true;
                                res.json({ 
                                    success: true, 
                                    sessionId: generatedSessionId,
                                    message: 'Session ID sent to your WhatsApp'
                                });
                            }
                            
                            await delay(1000);
                        }
                    } catch (err) {
                        console.error('Error generating/sending Base64 session:', err);
                        if (!responseSent && !res.headersSent) {
                            responseSent = true;
                            res.status(500).json({ error: 'Failed to generate session' });
                        }
                    } finally {
                        await cleanup('session_complete');
                    }
                }

                if (isNewLogin) {
                    console.log(`🔐 New login via pair code for ${num}`);
                }

                if (connection === 'close') {
                    if (sessionCompleted || isCleaningUp) {
                        console.log('✅ Session completed, not reconnecting');
                        await cleanup('already_complete');
                        return;
                    }

                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    
                    if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                        console.log(`❌ Logged out or invalid pairing for ${num}`);
                        if (!responseSent && !res.headersSent) {
                            responseSent = true;
                            res.status(401).json({ error: 'Invalid pairing code or session expired' });
                        }
                        await cleanup('logged_out');
                    } else if (pairingCodeSent && !sessionCompleted) {
                        reconnectAttempts++;
                        console.log(`🔁 Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} for ${num}`);
                        await delay(2000);
                        await initiateSession();
                    } else {
                        await cleanup('connection_closed');
                    }
                }
            });

            if (!sock.authState.creds.registered && !pairingCodeSent && !isCleaningUp) {
                await delay(1500);
                try {
                    pairingCodeSent = true;
                    let code = await sock.requestPairingCode(num);
                    code = code?.match(/.{1,4}/g)?.join('-') || code;

                    if (!responseSent && !res.headersSent) {
                        responseSent = true;
                        res.json({ code });
                        console.log(`📱 Pairing code sent for ${num}: ${code}`);
                    }
                } catch (error) {
                    console.error('❌ Error requesting pairing code:', error);
                    pairingCodeSent = false;
                    if (!responseSent && !res.headersSent) {
                        responseSent = true;
                        res.status(503).json({ error: 'Failed to get pairing code' });
                    }
                    await cleanup('pairing_code_error');
                }
            }

            sock.ev.on('creds.update', saveCreds);

            timeoutHandle = setTimeout(async () => {
                if (!sessionCompleted && !isCleaningUp) {
                    console.log(`⏰ Pairing timeout for ${num}`);
                    if (!responseSent && !res.headersSent) {
                        responseSent = true;
                        res.status(408).json({ error: 'Pairing timeout' });
                    }
                    await cleanup('timeout');
                }
            }, SESSION_TIMEOUT);

        } catch (err) {
            console.error(`❌ Error initializing session for ${num}:`, err);
            if (!responseSent && !res.headersSent) {
                responseSent = true;
                res.status(503).json({ error: 'Service Unavailable' });
            }
            await cleanup('init_error');
        }
    }

    await initiateSession();
}

// Add this at the end of your existing pair.js file

// Vercel serverless handler wrapper
export default async function handler(req, res) {
    // Create a mock Express app for Vercel
    const mockApp = express();
    
    // Set up CORS for Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Use your existing router
    mockApp.use('/', router);
    
    // Process the request
    return new Promise((resolve, reject) => {
        mockApp(req, res, (err) => {
            if (err) reject(err);
            resolve();
        });
    });
}
