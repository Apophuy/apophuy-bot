import 'dotenv/config';
import { ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from 'openai';
import { Context, Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters';
import { code } from 'telegraf/format';
import { Update } from 'telegraf/types';
import { openai } from './openai.js';
import { ogg } from './voice.js';

const INITIAL_SESSION = {
  message: [],
};

const bot: Telegraf<Context<Update>> = new Telegraf(process.env.TELEGRAM_TOKEN as string);

bot.use(session());

bot.command('new', async (ctx) => {
  // ctx.session = INITIAL_SESSION;
  await ctx.reply('Жду Вашего голосового или текстового сообщения...');
});
bot.command('start', async (ctx) => {
  // ctx.session = INITIAL_SESSION;
  await ctx.reply('Прювет');
});

bot.command('quit', async (ctx) => {
  await ctx.telegram.leaveChat(ctx.message.chat.id);
  await ctx.leaveChat();
});

bot.on(message('text'), async (ctx) => {
  try {
    const userId = String(ctx.message.from.id);
    if (process.env.PERMITTED_USERS?.includes(userId)) {
      const messages: ChatCompletionRequestMessage[] = [
        { role: ChatCompletionRequestMessageRoleEnum.User, content: ctx.message.text },
      ];
      const response = await openai.chat(messages);
      await ctx.reply(response?.content || '');
    } else {
      await ctx.reply('У вас нет доступа к этому боту | You do not have access to this bot');
    }
  } catch (e: any) {
    console.error('Error while text message', e.message);
  }
});

bot.on(message('voice'), async (ctx) => {
  // ctx.session ??= INITIAL_SESSION;
  try {
    await ctx.reply(code('Сообщение принял. Жду ответ от сервера...'));
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    if (process.env.PERMITTED_USERS?.includes(userId)) {
      const oggPath = await ogg.create(link.href, userId);
      const mp3Path = await ogg.toMp3(oggPath, userId);

      const text = await openai.transcription(mp3Path || '');
      await ctx.reply(code(`Ваш запрос: ${text}`));
      const messages: ChatCompletionRequestMessage[] = [
        { role: ChatCompletionRequestMessageRoleEnum.User, content: text },
      ];

      const response = await openai.chat(messages);
      await ctx.reply(response?.content || '');
    } else {
      await ctx.reply('У вас нет доступа к этому боту | You do not have access to this bot');
    }
  } catch (e: any) {
    console.error('Error while voice message', e.message);
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
