/* eslint-disable no-unused-vars */
// src/ai/llm.client.ts
import axios from 'axios';
export class DeepSeekClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl?: string,
  ) {}

  async complete(prompt: string): Promise<string> {
    const url = this.baseUrl || 'https://api.deepseek.com/v1/completions';
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const payload: any = {
      prompt,
      max_tokens: 256,
      temperature: 0.7,
      // Le modèle de DeepSeek attend un objet messages: [{ role: 'user', content: prompt }]
      // Il est important de vérifier la documentation exacte
      messages: [{ role: 'user', content: prompt }],
    };

    const { data } = await axios.post(url, payload, { headers, timeout: 20000 });
    console.log(`reounse de l'ai 🚀  🚀 🚀  ${JSON.stringify(data)}`);
    const text =
      data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? JSON.stringify(data);
    return typeof text === 'string' ? text : JSON.stringify(text);
  }
}
