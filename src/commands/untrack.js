import { InteractionContextType, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('untrack')
  .setDescription('Untrack a channel')
  .setContexts([InteractionContextType.Guild])
  .addChannelOption((option) => option.setName('channel').setDescription('Channel to remove from tracking'))
  .addBooleanOption((option) => option.setName('all').setDescription('Untrack every currently tracked channel'))
  .addStringOption((option) =>
    option.setName('exclude').setDescription('Channels to keep tracking when using all (mentions or ids)')
  );
