import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse large JSON requests (for base64 audio)
  app.use(express.json({ limit: '50mb' }));

  // AI API Route
  app.post('/api/analyze-audio', async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;
      
      if (!audioBase64) {
        return res.status(400).json({ error: 'No audio data provided' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // We instruct the model to return JSON matching our required structure
      const prompt = `
        You are an educational Automatic Speech Recognition (ASR) and Natural Language Understanding (NLU) system.
        I am sending you an audio recording of a user speaking.
        
        Perform the following tasks QUICKLY:
        1. Transcribe the audio exactly as spoken.
        2. Analyze the user's intent.
        3. Extract key words.
        4. Write a brief summary (max 1 sentence).
        5. Formulate a direct, helpful, and conversational reply to ANSWER the user's spoken input (max 2 sentences). If they ask a question, answer it. If they make a statement, reply to it.

        IMPORTANT: Your output MUST be a valid JSON object with the following exact structure, and NO OTHER TEXT:
        {
          "transcription": "The exact transcribed text",
          "intent": "Short description of the user's intent",
          "keywords": ["keyword1", "keyword2"],
          "summary": "Brief summary",
          "response": "Your helpful, conversational response directly answering or addressing what the user said"
        }
      `;

      let parsedResponse;
      let attempt = 0;
      const maxAttempts = 3;
      
      while (attempt < maxAttempts) {
        try {
          const startTime = Date.now();
          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      data: audioBase64.split(',')[1] || audioBase64,
                      mimeType: mimeType || 'audio/webm',
                    },
                  },
                  { text: prompt },
                ],
              }
            ],
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            }
          });
          console.log(`Gemini API call took ${Date.now() - startTime}ms`);

          const responseText = response.text;
          try {
            parsedResponse = JSON.parse(responseText);
          } catch (e) {
            console.error('Failed to parse Gemini response as JSON', responseText);
            return res.status(500).json({ error: 'Failed to parse AI response' });
          }
          break; // Success, exit loop
        } catch (error: any) {
          attempt++;
          console.error(`Gemini API attempt ${attempt} failed:`, error.message);
          
          if (attempt >= maxAttempts) {
            throw error; // Rethrow on final attempt
          }
          
          // Wait before retrying (exponential backoff: 1s, 2s)
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }

      res.json(parsedResponse);
    } catch (error: any) {
      console.error('Error processing audio:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
