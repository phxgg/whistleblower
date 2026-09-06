import { InteractionContextType, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('track')
  .setDescription('Track a channel')
  .setContexts([InteractionContextType.Guild])
  .addChannelOption((option) => option.setName('channel').setDescription('Channel to keep track of'))
  .addBooleanOption((option) => option.setName('all').setDescription('Track every text and voice channel of the guild'))
  .addStringOption((option) =>
    option.setName('exclude').setDescription('Channels to skip when using all (mentions or ids)')
  );
