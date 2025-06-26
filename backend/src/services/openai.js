const axios = require('axios');
const { v4: uuid } = require('uuid');
const RoleService = require('./roles');
const config = require('../config');

module.exports = class OpenAiService {
  static async askGpt(prompt) {
    if (!config.gpt_key) {
      return {
        success: false,
        error: 'API key is required'
      };
    }
    try {
      const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o',
            messages: [
              { role: 'user', content: prompt }
            ]
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.gpt_key}`
            }
          }
      );

      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          data: response.data.choices[0].message.content
        };
      } else {
        console.error('Error asking question to ChatGPT:', response.data);
        return {
          success: false,
          error: response.data
        };
      }
    } catch (error) {
      console.error('Error asking question to ChatGPT:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
};
