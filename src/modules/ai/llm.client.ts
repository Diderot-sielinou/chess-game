// src/ai/llm.client.ts
import * as dotenv from 'dotenv';
dotenv.config();
import { setTimeout } from 'timers/promises';
import { MyLoggerService } from '../my-logger/my-logger.service';

export class GeminiClient {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly logger?: MyLoggerService,
  ) {}

  private readonly apiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=';

  private readonly maxRetries = 3;
  private readonly fallbackResponse = 'The AI is currently unavailable.';

  /**
   * Sends a prompt to the Gemini AI and returns the textual response.
   * @param prompt Text to send to the AI
   */
  async complete(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not defined');
    }

    const payload = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.apiUrl}${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        this.logger?.log(`Attempt ${attempt} - AI response: ${result}`);

        if (!response.ok) {
          throw new Error(`API failure (status ${response.status}): ${result.error?.message}`);
        }

        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Invalid AI response.');

        return text;
      } catch (err) {
        this.logger?.warn(`Error calling Gemini (attempt ${attempt}): ${err}`);
        if (attempt < this.maxRetries) {
          // wait 500ms * attempt before retrying
          await setTimeout(500 * attempt);
        } else {
          this.logger?.error('All attempts failed, using fallback response.');
        }
      }
    }

    // Fallback if all attempts fail
    return this.fallbackResponse;
  }
}
