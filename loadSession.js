import fs from 'fs-extra';

export function decodeBase64Session(sessionId) {
    try {
        // Check if session ID starts with GURU~
        if (!sessionId.startsWith('GURU~')) {
            throw new Error('Invalid session format - must start with GURU~');
        }
        
        // Extract Base64 part after the prefix
        const base64Data = sessionId.substring(5); // Remove "GURU~"
        
        // Decode Base64 to JSON
        const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
        const credsData = JSON.parse(jsonString);
        
        return credsData;
    } catch (error) {
        console.error('Error decoding Base64 session:', error);
        return null;
    }
}

export async function loadSessionFromBase64(sessionId, sessionPath) {
    try {
        const credsData = decodeBase64Session(sessionId);
        if (!credsData) {
            throw new Error('Failed to decode session ID');
        }
        
        // Ensure directory exists
        await fs.ensureDir(sessionPath);
        
        // Save credentials
        const credsPath = `${sessionPath}/creds.json`;
        await fs.writeJson(credsPath, credsData, { spaces: 2 });
        
        console.log('✅ Session loaded successfully from Base64 ID');
        return true;
    } catch (error) {
        console.error('Error loading session from Base64:', error);
        return false;
    }
}
