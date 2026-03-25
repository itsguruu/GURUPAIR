import fs from 'fs-extra';

// Generate Base64 session from credentials
export function generateBase64Session(credsData, botName = 'GURU') {
    try {
        const base64String = Buffer.from(JSON.stringify(credsData)).toString('base64');
        const sessionId = `${botName}~${base64String}`;
        return sessionId;
    } catch (error) {
        console.error('Error generating Base64 session:', error);
        throw error;
    }
}

// Decode Base64 session to credentials
export function decodeBase64Session(sessionId) {
    try {
        if (!sessionId.startsWith('GURU~')) {
            throw new Error('Invalid session format - must start with GURU~');
        }
        
        const base64Data = sessionId.substring(5);
        const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
        const credsData = JSON.parse(jsonString);
        
        return credsData;
    } catch (error) {
        console.error('Error decoding Base64 session:', error);
        return null;
    }
}

// Load session from Base64 ID to file
export async function loadSessionFromBase64(sessionId, sessionPath) {
    try {
        const credsData = decodeBase64Session(sessionId);
        if (!credsData) {
            throw new Error('Failed to decode session ID');
        }
        
        await fs.ensureDir(sessionPath);
        const credsPath = `${sessionPath}/creds.json`;
        await fs.writeJson(credsPath, credsData, { spaces: 2 });
        
        console.log('✅ Session loaded successfully from Base64 ID');
        return true;
    } catch (error) {
        console.error('Error loading session from Base64:', error);
        return false;
    }
}

// Save credentials to Base64 session
export async function saveCredsToBase64(credsPath, botName = 'GURU') {
    try {
        const credsData = await fs.readJson(credsPath);
        return generateBase64Session(credsData, botName);
    } catch (error) {
        console.error('Error saving credentials to Base64:', error);
        throw error;
    }
}

export default generateBase64Session;
