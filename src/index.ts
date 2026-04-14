import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { initDb } from './services/database';
import { expenseCommandData, handleInteraction } from './expense';

config();

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error('DISCORD_TOKEN が設定されていません');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,  // awaitMessages に必要
    GatewayIntentBits.MessageContent, // メッセージ内容の読み取りに必要
  ],
});

client.once('ready', async (c) => {
  console.log(`Logged in as ${c.user.tag} (ID: ${c.user.id})`);

  initDb();
  console.log('Database initialized.');

  const rest = new REST().setToken(token);
  const guildId = process.env.GUILD_ID;
  if (guildId) {
    // GUILD_ID が設定されていればギルド登録（即時反映・開発向け）
    await rest.put(Routes.applicationGuildCommands(c.user.id, guildId), {
      body: [expenseCommandData],
    });
    console.log(`Slash commands registered to guild: ${guildId}`);
  } else {
    // 未設定ならグローバル登録（反映に最大1時間・本番向け）
    await rest.put(Routes.applicationCommands(c.user.id), {
      body: [expenseCommandData],
    });
    console.log('Slash commands registered globally.');
  }
});

client.on('interactionCreate', async (interaction) => {
  try {
    await handleInteraction(interaction);
  } catch (err) {
    console.error('Interaction error:', err);
    if (interaction.isRepliable() && !interaction.replied) {
      await interaction.reply({ content: 'エラーが発生しました。', ephemeral: true }).catch(() => {});
    }
  }
});

client.login(token);
