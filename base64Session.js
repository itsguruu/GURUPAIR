import fs from 'fs-extra';

/**
 * Generate Base64 session ID from credentials file or object
 * @param {string|object} input - File path, JSON string, or object
 * @param {string} prefix - Session prefix (default: 'GURU')
 * @returns {string} Base64 encoded session ID with prefix
 */
export function generateBase64Session(input, prefix = 'GURU') {
    try {
        let credsData;
        
        // Handle different input types
        if (typeof input === 'string') {
            if (fs.existsSync(input)) {
                // Read from file
                credsData = fs.readJsonSync(input);
            } else if (input.startsWith('{')) {
                // Parse JSON string
                credsData = JSON.parse(input);
            } else {
                throw new Error('Invalid input: not a file path or JSON string');
            }
        } else if (typeof input === 'object') {
            // Direct object
            credsData = input;
        } else {
            throw new Error('Unsupported input type');
        }
        
        // Convert to Base64
        const base64String = Buffer.from(JSON.stringify(credsData)).toString('base64');
        
        // Return with prefix
        const sessionId = `${prefix}~${base64String}`;
        
        console.log('✅ Base64 session ID generated successfully');
        console.log(`📏 Session ID length: ${sessionId.length} characters`);
        
        return sessionId;
    } catch (error) {
        console.error('❌ Error generating Base64 session:', error);
        throw error;
    }
}

/**
 * Decode Base64 session ID back to credentials object
 * @param {string} sessionId - Session ID with prefix (e.g., GURU~...)
 * @returns {object} Decoded credentials object
 */
export function decodeBase64Session(sessionId) {
    try {
        // Check if session ID has prefix
        const prefixMatch = sessionId.match(/^([A-Z]+)~/);
        if (!prefixMatch) {
            throw new Error('Invalid session format: missing prefix (e.g., GURU~)');
        }
        
        const prefix = prefixMatch[1];
        const base64Data = sessionId.substring(prefix.length + 1); // Remove "PREFIX~"
        
        // Decode Base64
        const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
        const credsData = JSON.parse(jsonString);
        
        console.log(`✅ Decoded Base64 session (prefix: ${prefix})`);
        return credsData;
    } catch (error) {
        console.error('❌ Error decoding Base64 session:', error);
        return null;
    }
}

/**
 * Save Base64 session to file
 * @param {string} sessionId - Base64 session ID
 * @param {string} outputPath - Path to save creds.json
 * @returns {boolean} Success status
 */
export async function saveBase64SessionToFile(sessionId, outputPath) {
    try {
        const credsData = decodeBase64Session(sessionId);
        if (!credsData) {
            throw new Error('Failed to decode session ID');
        }
        
        // Ensure directory exists
        await fs.ensureDir(outputPath.replace(/\/[^/]+$/, ''));
        
        // Save to file
        await fs.writeJson(outputPath, credsData, { spaces: 2 });
        
        console.log(`✅ Credentials saved to: ${outputPath}`);
        return true;
    } catch (error) {
        console.error('❌ Error saving Base64 session to file:', error);
        return false;
    }
}

/**
 * Legacy compatibility function to replace uploadToPastebin
 * This maintains compatibility with existing code structure
 * @param {string|object} input - File path or credentials object
 * @param {string} title - Ignored (kept for compatibility)
 * @param {string} format - Ignored (kept for compatibility)
 * @param {string} privacy - Ignored (kept for compatibility)
 * @returns {string} Base64 session ID
 */
export default async function generateSessionId(input, title = '', format = '', privacy = '') {
    try {
        // Generate Base64 session ID
        const sessionId = generateBase64Session(input, 'GURU');
        
        // Log for compatibility
        console.log('✅ Session ID generated (Base64 format)');
        console.log('📱 Copy this SESSION_ID:');
        console.log(sessionId);
        
        // Optional: Save to file for backup
        const backupFile = './session_id_backup.txt';
        await fs.writeFile(backupFile, sessionId);
        console.log(`💾 Session ID backed up to: ${backupFile}`);
        
        return sessionId;
    } catch (error) {
        console.error('Error generating session ID:', error);
        throw error;
    }
}
