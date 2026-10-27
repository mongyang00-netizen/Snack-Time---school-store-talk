import express, { Request, Response } from 'express';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { DIALOGUE_DATA, FeedbackResult } from './src/data/dialogueData';
import { evaluateSpokenTextLocally } from './src/utils/speechEvaluation';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;

// Initialize GoogleGenAI SDK on server-side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Server-side AI Feedback endpoint
 * Implements Section 7 of PRD:
 * Alex is a friendly, patient school store clerk.
 * Follows recast -> elicitation -> chunking rules and success criteria.
 */
app.post('/api/feedback', async (req: Request, res: Response) => {
  const { spokenText, turnId, failureAttemptNumber } = req.body;
  const turn = DIALOGUE_DATA.find((t) => t.id === Number(turnId));

  if (!turn) {
    return res.status(400).json({ error: 'Invalid turn ID' });
  }

  const spoken = (spokenText || '').trim();

  // Pre-calculate deterministic baseline from Section 7
  const localFallback: FeedbackResult = evaluateSpokenTextLocally(
    spoken,
    turn,
    Number(failureAttemptNumber) || 1
  );

  // If no API key or empty text, return local evaluation immediately
  if (!ai || !spoken) {
    return res.json(localFallback);
  }

  try {
    const prompt = `You are Alex, a friendly, encouraging school store clerk talking to a 1st-year Korean middle school student (CEFR A1-A2) practicing English to buy snacks at a school store.
Target student sentence: "${turn.studentTarget}"
Target Korean meaning: "${turn.studentKo}"
Required key words for success: ${JSON.stringify(turn.keyWords)}
First letter hint: "${turn.firstLetterHint}"
Sentence chunks: ${JSON.stringify(turn.chunks)}

Student's recognized speech: "${spoken}"
Current failure attempt count for this turn: ${failureAttemptNumber || 1}

CRITICAL EVALUATION & PRONUNCIATION RULES (PRD Section 7):
1. Start with praise and focus on only ONE thing to improve, using no more than two short sentences with Korean translations.
2. Focus on whether Alex can understand the student's message, rather than native-like pronunciation. Ignore punctuation and capitalization.
3. ACOUSTIC / PHONETIC VARIANT RULE FOR "an":
   In natural connected speech, the article "an" before a vowel sound ("an apple") is pronounced as the unstressed weak form /ən/. Standard speech recognition models commonly transcribe this weak form as "on apple", "and apple", "un apple", or "a apple".
   If the student said "on apple juice", "and apple juice", or "an apple juice", count this as a COMPLETE SUCCESS (category "success"). Do NOT penalize the student or claim "an" was missing.
4. STUDENT-AWARE CONTEXTUAL FEEDBACK (CRITICAL):
   Look carefully at what the student ACTUALLY said: "${spoken}".
   - If the student already spoke part of the sentence correctly (for example, student said "Here" for target "Here you are.", or "sandwich" for "Can I have a sandwich, please?"):
     * Explicitly PRAISE what they already said (e.g., "'Here'는 아주 잘 말했어요!").
     * Focus feedback ONLY on the remaining missing words (e.g., elicit "you are").
     * NEVER ask the student to say a word starting with the letter of a word they ALREADY said! (For example, if the student already said "Here", NEVER ask them to say a word starting with 'H'!).
   - If they only spoke partial words, for elicitation (attempt 2), give a hint for the FIRST MISSING word, not the already-spoken word.
5. SUCCESS CRITERIA:
   - Count the response as SUCCESSFUL when all key words (${JSON.stringify(turn.keyWords)}) are recognized, even if small non-key words are slightly varied.
   - If completely correct: category "success".
   - If key words are present but a non-key word was omitted: category "success_missing_small", praise that you understood, and gently encourage them to use the small word next time.
6. IF KEY WORDS ARE MISSING (Failure Progression):
   - 1st failure (attempt 1): category "recast", acknowledge any correct words and provide the full model sentence.
   - 2nd failure (attempt 2): category "elicitation", give the first-letter hint for the missing word.
   - 3rd failure (attempt 3+): category "chunking", break sentence into parts: ${turn.chunks.join(' / ')}.
7. Avoid negative words, numerical scores, and percentiles. Keep English simple and Korean translation warm and natural.

Return JSON adhering to schema:
- success (boolean)
- category ("success" | "success_missing_small" | "recast" | "elicitation" | "chunking" | "no_speech")
- feedbackEn (string, 1-2 friendly sentences in simple English)
- feedbackKo (string, accurate natural Korean translation of the feedback in parentheses or standalone)
- missingWord (optional string)
- hint (optional string)
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
        maxOutputTokens: 250,
        thinkingConfig: {
          thinkingBudget: 0,
        },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN },
            category: {
              type: Type.STRING,
              description: 'Feedback category',
            },
            feedbackEn: { type: Type.STRING },
            feedbackKo: { type: Type.STRING },
            missingWord: { type: Type.STRING },
            hint: { type: Type.STRING },
          },
          required: ['success', 'category', 'feedbackEn', 'feedbackKo'],
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      return res.json({
        ...parsed,
        recognizedText: spoken,
      });
    }

    return res.json(localFallback);
  } catch (err) {
    console.error('Gemini feedback error, falling back to local evaluation:', err);
    return res.json(localFallback);
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Snack Time! — School Store Talk' });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
