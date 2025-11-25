import { SlashCommandBuilder, ChannelType, InteractionContextType } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('log')
  .setDescription('Setup a logging channel for a specific event')
  .setContexts([InteractionContextType.Guild])
  .addSubcommand(subcommand =>
    subcommand
      .setName('message_delete')
      .setDescription('Setup a logging channel for deleted messages')
      .addChannelOption(option =>
        option
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
          .setName('channel')
          .setDescription('Channel to log deleted messages')
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('message_update')
      .setDescription('Setup a logging channel for edited messages')
      .addChannelOption(option =>
        option
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
          .setName('channel')
          .setDescription('Channel to log edited messages')
      )
  );
