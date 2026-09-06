import { ChannelType, InteractionContextType, SlashCommandBuilder } from 'discord.js';

import { addToLoggingChannels, getLoggingChannels, LOG_EVENTS } from '../services/guild.service.js';

export const data = new SlashCommandBuilder()
  .setName('log')
  .setDescription('Setup a logging channel for a specific event')
  .setContexts([InteractionContextType.Guild])
  .addSubcommand((subcommand) =>
    subcommand
      .setName('message_delete')
      .setDescription('Setup a logging channel for deleted messages')
      .addChannelOption((option) =>
        option
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
          .setName('channel')
          .setDescription('Channel to log deleted messages')
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('message_update')
      .setDescription('Setup a logging channel for edited messages')
      .addChannelOption((option) =>
        option
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
          .setName('channel')
          .setDescription('Channel to log edited messages')
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('all')
      .setDescription('Setup one logging channel for every event')
      .addChannelOption((option) =>
        option
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
          .setName('channel')
          .setDescription('Channel to log every event')
      )
  )
  .addSubcommand((subcommand) => subcommand.setName('list').setDescription('Show the logging channel of every event'));

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  const event = interaction.options.getSubcommand();

  if (event === 'list') {
    const loggingChannels = (await getLoggingChannels(interaction.guild.id)) || {};
    const lines = LOG_EVENTS.map((e) => `\`${e}\`: ${loggingChannels[e] ? `<#${loggingChannels[e]}>` : 'not set'}`);

    return interaction.editReply(lines.join('\n'));
  }

  const channel = interaction.options.getChannel('channel');

  if (event === 'all') {
    for (const e of LOG_EVENTS) {
      await addToLoggingChannels(e, interaction.guild.id, channel.id);
    }

    return interaction.editReply(`:white_check_mark: Logging every event in ${channel}`);
  }

  await addToLoggingChannels(event, interaction.guild.id, channel.id);

  return interaction.editReply(`:white_check_mark: Logging event \`${event}\` in ${channel}`);
}
