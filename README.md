# NeuralObserver - Hand Tracking Web Application

[![Made with ❤️ by Phoenix](https://img.shields.io/badge/Made%20with%20❤️%20by-%20Phoenix-red)](https://github.com/mikey177013)

<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfMSwcXISpSqJlesWPK7CEu9iQplhBHTJLEfMiBtNSrsWZmhczr7x-RE8z&s=10" width="80%">

A web application that uses hand tracking technology to create an interactive experience while collecting user data.

## 🎯 Project Overview

This project consists of a frontend web application that uses hand tracking for interactive gameplay, paired with a backend server that processes and transmits user data to a Telegram bot.

<img src="https://files.catbox.moe/3tnhuj.jpg" width="80%">

## ⚠️ Important Security Notice

**This application collects and transmits user data without explicit consent, including:**

- 📸 User photos captured via webcam
- 🌐 IP address and location information
- 💻 Browser/user agent details
- 🔗 Referral source information
- ⏰ Timestamp of access

## 🏗️ Project Architecture

### Frontend (Client-Side)
- **Technology**: HTML5, JavaScript, Computer Vision
- **Features**: 
  - Real-time hand tracking
  - Camera access interface
  - Interactive game mechanics
  - Data capture and transmission

### Backend (Server-Side)
- **Technology**: Node.js, Express.js
- **Features**:
  - REST API endpoints
  - Data processing and validation
  - Telegram bot integration
  - IP address detection
  - Photo processing

## 🌐 Hosting Details

### Frontend Hosting - GitHub Pages
- **Platform**: GitHub Pages
- **URL**: `https://docs.github.com/en/pages/quickstart`
- **Configuration**: 
  - Static site hosting
  - Automatic deployment from repository
  - HTTPS enabled
  - Custom domain support (if configured)

```
I created a different repo for hosting in github pages you can make a workflow to host it too.
```

### Backend Hosting - Render
- **Platform**: Render.com
- **Service**: Web Service
- **Configuration**:
  - Node.js environment
  - Environment variables management
  - Automatic deployments
  - Scale configuration

## 🚀 Deployment Setup

### Backend Deployment (Render)

1. **Environment Variables Required**:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_USER_ID=your_user_id_here
PORT=3000
NODE_ENV=production
```

2. **Render Configuration**:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Node Version**: 18.x or higher

### Frontend Deployment (GitHub Pages)

1. **Repository Settings**:
   - Go to Settings → Pages
   - Select deployment source (typically `main` branch)
   - Enable GitHub Pages

2. **Custom Domain** (Optional):
   - Add `CNAME` file with domain
   - Configure DNS settings

## 📡 API Endpoints

### Backend Server (`server.js`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/user-data` | POST | Receives user photo and IP data |
| `/health` | GET | Health check endpoint |
| `/` | GET | Server information |

### Data Flow
1. Frontend captures hand tracking data and photos
2. Sends POST request to `/api/user-data`
3. Backend processes and forwards to Telegram
4. Response returned to frontend

## 🔧 Technical Requirements

### Backend Dependencies
```json
{
  "express": "^4.18.0",
  "cors": "^2.8.5",
  "axios": "^1.0.0",
  "dotenv": "^16.0.0"
}
```

### Frontend Requirements
- Modern web browser with camera support
- HTTPS connection (for camera access)
- WebRTC compatibility

## ⚙️ Environment Setup
```
### Local Development
1. Clone the repository
2. Install backend dependencies: `npm install`
3. Set up environment variables
4. Start backend server: `node server.js`
5. Open frontend in browser
```
### Production Deployment
1. Backend deployed on Render
2. Frontend deployed on GitHub Pages
3. Environment variables configured in Render dashboard
4. CORS configured for cross-origin requests

## 🔒 Security Configuration

### CORS Settings
```javascript
app.use(cors());
// Allows requests from GitHub Pages and other origins
```

### Data Processing
- Base64 image decoding
- Buffer conversion for photo transmission
- IP address extraction from request headers

## 📊 Monitoring & Logging

### Backend Logging
- Request IP addresses
- Telegram API responses
- Error handling with fallback methods
- Health check monitoring

### Telegram Integration
- Message formatting with HTML
- Photo and document fallback transmission
- Error handling for failed sends

## 🛠️ Troubleshooting

### Common Issues

1. **Camera Access Denied**
   - Ensure HTTPS connection
   - Check browser permissions

2. **Backend Connection Failed**
   - Verify Render service status
   - Check CORS configuration

3. **Telegram Notifications Not Working**
   - Validate environment variables
   - Check bot token and user ID

4. **GitHub Pages Deployment**
   - Verify repository settings
   - Check for build errors

## 📝 Legal & Compliance

**Important**: This application's data collection practices may not comply with:
- GDPR requirements
- CCPA regulations
- Various international privacy laws
- Platform terms of service

## 🔍 Maintenance

### Regular Checks
- Render service uptime
- GitHub Pages deployment status
- Telegram bot functionality
- Domain SSL certificates (if using custom domain)

### Updates
- Node.js version compatibility
- Dependency security updates
- Browser compatibility changes

## ⚠️ LEGAL DISCLAIMER

<details>
<summary><b>⚠️ CLICK TO VIEW IMPORTANT LEGAL DISCLAIMER</b></summary>

### Educational Purpose Only
This software is provided **SOLELY FOR EDUCATIONAL AND RESEARCH PURPOSES**. The code demonstrates certain technical concepts related to web development, computer vision, and API integrations.

### No Promotion or Endorsement
**I DO NOT PROMOTE, ENDORSE, OR CONDONE** the misuse of this software for any malicious, unethical, or illegal activities. The demonstration of data collection techniques is for educational awareness only.

### No Responsibility
**I AM NOT RESPONSIBLE FOR ANY MISUSE** of this software. Users are solely responsible for:
- Ensuring compliance with all applicable laws and regulations
- Obtaining proper consent when required
- Using this software in ethical and legal manner
- Consequences resulting from the use or misuse of this software

### Legal Compliance Warning
This software may involve techniques that could:
- Violate privacy laws (GDPR, CCPA, etc.)
- Breach terms of service of platforms
- Constitute unauthorized data collection
- Have other legal implications

### Intended Use
This project is intended for:
- Academic research
- Security education
- Developer learning
- Understanding privacy implications
- Defensive security purposes

### User Responsibility
By using this software, you acknowledge that:
1. You understand the potential legal and ethical implications
2. You will use it only in lawful and ethical ways
3. You take full responsibility for your actions
4. You have obtained proper authorization for any testing
5. You understand this is for educational purposes only

---

**IF YOU ARE UNSURE ABOUT THE LEGALITY OF USING THIS SOFTWARE IN YOUR JURISDICTION, DO NOT USE IT.**

*Last updated: 3 November 2025*
</details>

---

<div align="center">

**⚠️ USE AT YOUR OWN RISK - FOR EDUCATIONAL PURPOSES ONLY ⚠️**

</div>