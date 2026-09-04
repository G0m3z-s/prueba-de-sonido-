const { GoogleGenAI } = require('@google/genai');

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: "This is a placeholder for audio" },
            { text: prompt },
          ],
        }
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      }
    });
    console.log(response.text());
  } catch (e) {
    console.error(e);
  }
}
test();
