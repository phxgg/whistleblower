import { SlashCommandBuilder, InteractionContextType } from 'discord.js';

// TODO: option to untrack all channels in the guild

export const data = new SlashCommandBuilder()
  .setName('untrack')
  .setDescription('Untrack a channel')
  .setContexts([InteractionContextType.Guild])
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('Channel to remove from tracking')
  );
