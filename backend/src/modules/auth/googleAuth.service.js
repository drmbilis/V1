const { google } = require('googleapis');
require('dotenv').config();

class GoogleAuthService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/adwords'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async getTokens(code) {
    // BURASI KRİTİK: Google'a kodu gönderirken hangi URI ile istediğimizi tekrar teyit ediyoruz.
    const { tokens } = await this.oauth2Client.getToken({
      code: code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI
    });
    return tokens;
  }

  async getUserInfo(accessToken) {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    
    const oauth2 = google.oauth2({
      auth: this.oauth2Client,
      version: 'v2'
    });

    const { data } = await oauth2.userinfo.get();
    return data;
  }
}

module.exports = new GoogleAuthService();