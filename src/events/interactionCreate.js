import { Events, PermissionsBitField } from 'discord.js';

import {
  addToLoggingChannels,
  addToTrackChannels,
  getLoggingChannels,
  getTrackChannels,
  LOG_EVENTS,
  removeFromTrackChannels,
  trackableChannelIds,
} from '../services/guild.service.js';
import { parseIds } from '../shared.js';

export default {
  name: Events.InteractionCreate,
  once: false,
  /**
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    await interaction.deferReply({ ephemeral: true });

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.editReply(':x: You are not an admin.');

    const guildId = interaction.guild.id;

    if (interaction.commandName === 'log') {
      const event = interaction.options.getSubcommand();

      if (event === 'list') {
        const loggingChannels = (await getLoggingChannels(guildId)) || {};
        const lines = LOG_EVENTS.map((e) => `\`${e}\`: ${loggingChannels[e] ? `<#${loggingChannels[e]}>` : 'not set'}`);

        return interaction.editReply(lines.join('\n'));
      }

      const channel = interaction.options.getChannel('channel');

      if (event === 'all') {
        for (const e of LOG_EVENTS) {
          await addToLoggingChannels(e, guildId, channel.id);
        }

        return interaction.editReply(`:white_check_mark: Logging every event in ${channel}`);
      }

      await addToLoggingChannels(event, guildId, channel.id);

      return interaction.editReply(`:white_check_mark: Logging event \`${event}\` in ${channel}`);
    }

    if (interaction.commandName === 'track' || interaction.commandName === 'untrack') {
      const tracking = interaction.commandName === 'track';
      const trackChannels = await getTrackChannels(guildId);

      if (interaction.options.getBoolean('all')) {
        const excluded = parseIds(interaction.options.getString('exclude'));
        // Tracking looks at every eligible channel, untracking only at what is currently tracked.
        const channelIds = tracking
          ? (await trackableChannelIds(interaction.guild, excluded)).filter((id) => !trackChannels.includes(id))
          : trackChannels.filter((id) => !excluded.includes(id));

        if (channelIds.length === 0) {
          return interaction.editReply(`:x: No channels left to ${interaction.commandName}.`);
        }

        if (tracking) await addToTrackChannels(guildId, channelIds);
        else await removeFromTrackChannels(guildId, channelIds);

        return interaction.editReply(
          `:white_check_mark: ${tracking ? 'Tracking' : 'No longer tracking'} ${channelIds.length} channel(s).`
        );
      }

      const channel = interaction.options.getChannel('channel') || interaction.channel;

      if (trackChannels.includes(channel.id) === tracking) {
        return interaction.editReply(
          tracking ? `:x: Already tracking ${channel.name}` : `:x: Not tracking ${channel.name}`
        );
      }

      if (tracking) await addToTrackChannels(guildId, channel.id);
      else await removeFromTrackChannels(guildId, channel.id);

      return interaction.editReply(
        tracking
          ? `:white_check_mark: Tracking ${channel.name}`
          : `:white_check_mark: No longer tracking ${channel.name}`
      );
    }
  },
};
