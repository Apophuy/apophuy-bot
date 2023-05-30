import { unlink } from 'fs/promises';
import { ChatCompletionRequestMessage } from 'openai';
import { Context } from 'telegraf';

export async function removeFile(path: string) {
  try {
    await unlink(path);
  } catch (e: any) {
    console.error('Error while removing file', e.message);
  }
}
export interface SessionData {
  messages: ChatCompletionRequestMessage[];
}

export interface BotContext extends Context {
  session: SessionData;
}
