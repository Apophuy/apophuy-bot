import 'dotenv/config';
import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters';
import { code } from 'telegraf/format';
import { openai } from './openai.js';
import { BotContext } from './utils.js';
import { ogg } from './voice.js';

const INITIAL_SESSION = {
  messages: [],
};

const bot: Telegraf<BotContext> = new Telegraf(process.env.TELEGRAM_TOKEN as string);

bot.use(session());

bot.command('new', async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply('Давай уже новую тему!');
});
bot.command('start', async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply('Прювет');
});

bot.command('quit', async (ctx) => {
  await ctx.telegram.leaveChat(ctx.message.chat.id);
  await ctx.leaveChat();
});

bot.on(message('text'), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    const userId = String(ctx.message.from.id);
    if (process.env.PERMITTED_USERS?.includes(userId)) {
      ctx.session.messages.push({
        role: ChatCompletionRequestMessageRoleEnum.Assistant,
        content: ctx.message.text,
      });
      const response = await openai.chat(ctx.session.messages);

      await ctx.reply(response?.content || '');
    } else {
      await ctx.reply('Иди на хер | You do not have access to this bot');
    }
  } catch (e: any) {
    console.error('Error while text message', e.message);
  }
});

bot.on(message('voice'), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    await ctx.reply(code('Сообщение принял. Жду ответ от сервера...'));
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    if (process.env.PERMITTED_USERS?.includes(userId)) {
      const oggPath = await ogg.create(link.href, userId);
      const mp3Path = await ogg.toMp3(oggPath, userId);

      const text = await openai.transcription(mp3Path || '');
      await ctx.reply(code(`Ваш запрос: ${text}`));
      ctx.session.messages.push({ role: ChatCompletionRequestMessageRoleEnum.User, content: text });

      const response = await openai.chat(ctx.session.messages);

      ctx.session.messages.push({
        role: ChatCompletionRequestMessageRoleEnum.Assistant,
        content: response?.content || '',
      });

      await ctx.reply(response?.content || '');
    } else {
      await ctx.reply('Иди на хер | You do not have access to this bot');
    }
  } catch (e: any) {
    console.error('Error while voice message', e.message);
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
