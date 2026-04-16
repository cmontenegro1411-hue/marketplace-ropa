import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  // Solo advertir en build time, no romper la app
  console.warn('[openai] OPENAI_API_KEY no configurada en variables de entorno.');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});
