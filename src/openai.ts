import { createReadStream } from 'fs';
import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  Configuration,
  OpenAIApi,
} from 'openai';

class OpenAI {
  openai: OpenAIApi;

  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async chat(
    messages: ChatCompletionRequestMessage[],
  ): Promise<ChatCompletionResponseMessage | undefined> {
    try {
      const response = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo', // ! Выяснить почему не хочет работать с моделью 'gpt-4'
        messages,
      });

      return response.data.choices[0].message;
    } catch (e: any) {
      console.error('Error while gpt chat working...', e.message);
    }
  }

  async transcription(path: string): Promise<string> {
    try {
      const response = await this.openai.createTranscription(createReadStream(path), 'whisper-1');
      return response.data.text;
    } catch (e: any) {
      console.error('Error while transcription', e.message);
    }
    return '';
  }
}

export const openai = new OpenAI();
