const axios = require('axios');
require('dotenv').config();

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
  }

  async chat(messages, options = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: options.model || 'deepseek-chat',
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API Error:', error.response?.data || error.message);
      throw new Error('Failed to get response from DeepSeek');
    }
  }

  async analyzePerformanceTrend(campaignData, metricsHistory) {
    const messages = [
      {
        role: 'system',
        content: 'You are a data analyst expert. Analyze campaign performance trends and respond ONLY with valid JSON. No markdown, no explanations outside JSON.'
      },
      {
        role: 'user',
        content: `
Analyze this campaign's performance trend over the last 30 days:

Campaign: ${campaignData.name}
Daily Metrics (last 10 days sample):
${JSON.stringify(metricsHistory.slice(-10), null, 2)}

Respond in this EXACT JSON format:
{
  "trend": "improving|declining|stable",
  "trendStrength": 0.75,
  "anomalies": [
    {
      "date": "2024-01-15",
      "metric": "conversions",
      "type": "spike|drop",
      "severity": "high|medium|low",
      "value": 10,
      "expected": 5
    }
  ],
  "predictions": {
    "next7Days": {
      "clicks": 1000,
      "conversions": 50,
      "cost": 500
    }
  },
  "insights": ["insight1", "insight2"],
  "confidence": 0.8
}
`
      }
    ];

    const response = await this.chat(messages);
    return this.parseJsonResponse(response);
  }

  async optimizeROI(campaignData, metrics, businessGoals = {}) {
    const messages = [
      {
        role: 'system',
        content: 'You are a ROI optimization expert. Provide actionable recommendations in valid JSON only.'
      },
      {
        role: 'user',
        content: `
Campaign: ${campaignData.name}
Current Metrics:
${JSON.stringify(metrics, null, 2)}

Business Goals:
- Target ROAS: ${businessGoals.targetRoas || 'Not set'}
- Max CPA: $${businessGoals.maxCpa || 'Not set'}
- Monthly Budget: $${businessGoals.monthlyBudget || 'Not set'}

Provide ROI optimization in EXACT JSON format:
{
  "currentRoas": 2.5,
  "projectedRoas": 3.2,
  "optimizations": [
    {
      "action": "increase_budget",
      "target": "daily_budget",
      "currentValue": 50,
      "recommendedValue": 65,
      "expectedImpact": "+25% conversions",
      "priority": "high"
    }
  ],
  "costSavings": {
    "amount": 150,
    "actions": ["remove low-performing keywords"]
  },
  "quickWins": ["quick action 1", "quick action 2"],
  "confidence": 0.85
}
`
      }
    ];

    const response = await this.chat(messages);
    return this.parseJsonResponse(response);
  }

  async detectAnomalies(metricsData) {
    const messages = [
      {
        role: 'system',
        content: 'You are an anomaly detection specialist. Identify unusual patterns in campaign data. Respond in JSON only.'
      },
      {
        role: 'user',
        content: `
Analyze these daily metrics for anomalies:

${JSON.stringify(metricsData, null, 2)}

Detect anomalies and respond in EXACT JSON:
{
  "anomalies": [
    {
      "date": "2024-01-15",
      "metric": "cost",
      "severity": "high",
      "description": "Cost spike of 150% above average",
      "possibleCauses": ["cause1", "cause2"],
      "recommendedAction": "investigate and adjust bids"
    }
  ],
  "overallHealth": "good|warning|critical",
  "alerts": ["alert1", "alert2"]
}
`
      }
    ];

    const response = await this.chat(messages);
    return this.parseJsonResponse(response);
  }

  parseJsonResponse(text) {
    try {
      let cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }

      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to parse JSON:', text);
      return { 
        error: 'Failed to parse AI response',
        raw: text,
        parsed: false 
      };
    }
  }
}

module.exports = new DeepSeekService();
