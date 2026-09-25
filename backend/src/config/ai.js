import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from './logger.js';

export const RATE_LIMITS = {
  requestsPerMinute: parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || '15', 10),
  requestsPerDay: parseInt(process.env.AI_RATE_LIMIT_PER_DAY || '1500', 10)
};

const apiKey = process.env.GEMINI_API_KEY || '';
const defaultModelName = process.env.AI_MODEL || 'gemini-1.5-flash';
const maxTokens = parseInt(process.env.AI_MAX_TOKENS || '4096', 10);
const temperature = parseFloat(process.env.AI_TEMPERATURE || '0.7');

let genAIInstance = null;
let modelInstance = null;

if (apiKey) {
  try {
    genAIInstance = new GoogleGenerativeAI(apiKey);
    modelInstance = genAIInstance.getGenerativeModel({
      model: defaultModelName,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature
      }
    });
    logger.info({ model: defaultModelName }, 'Google Gemini AI initialized successfully');
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to initialize Google Gemini AI client');
  }
} else {
  logger.warn('GEMINI_API_KEY is not set. Google Gemini AI service will operate in mock/fallback mode.');
}

export const genAI = genAIInstance;
export const model = modelInstance;

export const isConfigured = () => {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY);
};

export const getModel = (modelName = defaultModelName, customConfig = {}) => {
  if (!genAIInstance) {
    const currentKey = process.env.GEMINI_API_KEY;
    if (currentKey) {
      genAIInstance = new GoogleGenerativeAI(currentKey);
    }
  }
  if (!genAIInstance) return null;
  return genAIInstance.getGenerativeModel({
    model: modelName,
    generationConfig: {
      maxOutputTokens: customConfig.maxTokens || maxTokens,
      temperature: customConfig.temperature !== undefined ? customConfig.temperature : temperature
    }
  });
};

export default {
  genAI,
  model,
  RATE_LIMITS,
  isConfigured,
  getModel
};
