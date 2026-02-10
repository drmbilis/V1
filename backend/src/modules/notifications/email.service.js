const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendBudgetAlert(to, data) {
    const { campaignName, currentSpend, limit } = data;
    
    return await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'Google Ads AI <noreply@googleadsai.com>',
      to,
      subject: '⚠️ Budget Alert: Spending Limit Reached',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">⚠️ Budget Alert</h2>
          <p>Your campaign <strong>"${campaignName}"</strong> has reached its spending limit.</p>
          
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <ul style="margin: 0; padding-left: 20px;">
              <li>Current Spend: <strong>$${currentSpend.toFixed(2)}</strong></li>
              <li>Limit: <strong>$${limit.toFixed(2)}</strong></li>
            </ul>
          </div>
          
          <p>Campaigns have been automatically paused to prevent overspending.</p>
          
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            View Dashboard
          </a>
        </div>
      `
    });
  }

  async sendRecommendationAlert(to, data) {
    const { count, recommendations } = data;
    
    return await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: `✨ ${count} New AI Recommendations Available`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">✨ New AI Recommendations</h2>
          <p>AI has generated <strong>${count} new optimization recommendations</strong> for your campaigns.</p>
          
          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Highlights:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${recommendations?.slice(0, 3).map(r => 
                `<li>${r.type}: ${r.rationale?.substring(0, 80)}...</li>`
              ).join('') || '<li>View recommendations for details</li>'}
            </ul>
          </div>
          
          <a href="${process.env.FRONTEND_URL}/recommendations" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Review Recommendations
          </a>
        </div>
      `
    });
  }

  async sendWeeklyReport(to, data) {
    const { totalSpend, totalClicks, totalConversions, saved, startDate, endDate } = data;
    
    return await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: '📊 Your Weekly Google Ads Performance Report',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">📊 Weekly Performance Summary</h2>
          <p style="color: #6b7280;">
            ${startDate} - ${endDate}
          </p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f9fafb;">
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Total Spend</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">
                $${totalSpend.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Total Clicks</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">
                ${totalClicks.toLocaleString()}
              </td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Conversions</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">
                ${totalConversions}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px;">AI Cost Savings</td>
              <td style="padding: 12px; text-align: right; font-weight: bold; color: #10b981;">
                $${saved.toFixed(2)}
              </td>
            </tr>
          </table>
          
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            View Full Report
          </a>
        </div>
      `
    });
  }

  async sendApplySuccess(to, data) {
    const { campaignName, changes } = data;
    
    return await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: '✅ AI Recommendation Applied Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">✅ Changes Applied</h2>
          <p>Your AI recommendation for <strong>"${campaignName}"</strong> has been successfully applied.</p>
          
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p><strong>Changes made:</strong></p>
            <pre style="background: white; padding: 10px; border-radius: 4px; overflow-x: auto;">
${JSON.stringify(changes, null, 2)}
            </pre>
          </div>
          
          <a href="${process.env.FRONTEND_URL}/apply-history" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            View Apply History
          </a>
        </div>
      `
    });
  }
}

module.exports = new EmailService();
