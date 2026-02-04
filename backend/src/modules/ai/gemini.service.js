const axios = require('axios');
require('dotenv').config();

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL || 'gemini-pro';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async generateContent(prompt, systemInstruction = '') {
    try {
      const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
      
      const payload = {
        contents: [{
          parts: [{
            text: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      };

      const response = await axios.post(url, payload);
      
      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.data.candidates[0].content.parts[0].text;
      }
      
      throw new Error('Invalid response from Gemini API');
    } catch (error) {
      console.error('Gemini API Error:', error.response?.data || error.message);
      throw new Error('Failed to generate content with Gemini');
    }
  }

  async generateKeywordRecommendations(campaignData, currentKeywords = []) {
    const systemPrompt = `You are an expert Google Ads strategist. Generate keyword recommendations in valid JSON format only. No markdown, no code blocks, just pure JSON.`;

    const prompt = `
Campaign: ${campaignData.name}
Type: ${campaignData.channelType || 'SEARCH'}
Current Keywords: ${currentKeywords.slice(0, 10).join(', ') || 'None'}

Generate keyword recommendations in this EXACT JSON format:
{
  "keywords": [
    {
      "text": "keyword phrase",
      "matchType": "EXACT",
      "suggestedBid": 2.50,
      "rationale": "why this keyword"
    }
  ],
  "negativeKeywords": ["negative1", "negative2"],
  "confidence": 0.85,
  "expectedImpact": {
    "impressions": "+15%",
    "clicks": "+10%",
    "conversions": "+5%"
  },
  "rationale": "Overall strategy explanation"
}

Provide 5-10 keyword suggestions with exact match type and suggested bids.
`;

    const response = await this.generateContent(prompt, systemPrompt);
    return this.parseJsonResponse(response);
  }

  async generateAdCopyRecommendations(campaignData, productInfo = {}) {
    const systemPrompt = `You are a Google Ads copywriting expert. Generate ad copy in valid JSON format only.`;

    const prompt = `
Campaign: ${campaignData.name}
Product: ${productInfo.name || campaignData.name}
Description: ${productInfo.description || 'Not provided'}

Generate RSA (Responsive Search Ad) recommendations in EXACT JSON format:
{
  "headlines": ["headline 1 (max 30 chars)", "headline 2", "headline 3"],
  "descriptions": ["description 1 (max 90 chars)", "description 2"],
  "confidence": 0.8,
  "expectedImpact": {
    "ctr": "+12%",
    "conversions": "+8%"
  },
  "rationale": "Why this copy works"
}

Generate 3 headline variations and 2 description variations.
`;

    const response = await this.generateContent(prompt, systemPrompt);
    return this.parseJsonResponse(response);
  }

  async generateBudgetRecommendation(campaignData, metrics) {
    const systemPrompt = `You are a Google Ads budget optimization expert. Respond in valid JSON format only.`;

    const currentBudget = parseFloat(campaignData.budget) || 0;
    const avgCost = metrics?.avgCost || 0;
    const conversions = metrics?.conversions || 0;
    const clicks = metrics?.clicks || 0;

    const prompt = `
Campaign: ${campaignData.name}
Current Daily Budget: $${currentBudget}
Last 30 Days:
- Total Cost: $${avgCost}
- Clicks: ${clicks}
- Conversions: ${conversions}
- Conversion Rate: ${clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : 0}%

Analyze and recommend budget adjustment in EXACT JSON format:
{
  "currentBudget": ${currentBudget},
  "recommendedBudget": 0,
  "changePercent": 0,
  "confidence": 0.75,
  "expectedImpact": {
    "impressions": "+0%",
    "clicks": "+0%",
    "conversions": "+0%"
  },
  "rationale": "Detailed explanation",
  "riskLevel": "low"
}

Consider: Max 30% budget change allowed. Min budget $5/day.
`;

    const response = await this.generateContent(prompt, systemPrompt);
    const result = this.parseJsonResponse(response);

    // Apply guardrails
    if (result.recommendedBudget) {
      const maxChange = currentBudget * 0.30;
      const maxBudget = currentBudget + maxChange;
      const minBudget = Math.max(5, currentBudget - maxChange);

      result.recommendedBudget = Math.max(minBudget, Math.min(maxBudget, result.recommendedBudget));
      result.recommendedBudget = parseFloat(result.recommendedBudget.toFixed(2));
    }

    return result;
  }

  async generatePauseRecommendation(campaignData, metrics) {
    const systemPrompt = `You are a Google Ads performance analyst. Respond in valid JSON only.`;

    const conversions = metrics?.conversions || 0;
    const cost = metrics?.cost || 0;
    const clicks = metrics?.clicks || 0;
    const ctr = metrics?.ctr || 0;

    const prompt = `
Campaign: ${campaignData.name}
Status: ${campaignData.status}
Last 30 Days:
- Cost: $${cost}
- Clicks: ${clicks}
- Conversions: ${conversions}
- CTR: ${(ctr * 100).toFixed(2)}%

Should this campaign be paused? Respond in EXACT JSON:
{
  "shouldPause": false,
  "confidence": 0.7,
  "rationale": "Explanation",
  "riskLevel": "medium",
  "alternativeActions": ["action1", "action2"]
}

Consider pausing if: zero conversions with high spend, very low CTR, or wasted budget.
`;

    const response = await this.generateContent(prompt, systemPrompt);
    return this.parseJsonResponse(response);
  }

  parseJsonResponse(text) {
    try {
      // Remove markdown code blocks
      let cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      
      // Try to extract JSON if wrapped in text
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

module.exports = new GeminiService();
