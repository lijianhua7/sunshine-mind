import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini AI client
export const ai = new GoogleGenAI({ 
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' 
});

export const MODELS = {
  text: 'gemini-3-flash-preview',
  pro: 'gemini-3.1-pro-preview',
};
