import { Events } from 'discord.js';

import {
  addToLoggingChannels,
  addToTrackChannels,
  getTrackChannels,
  removeFromTrackChannels,
} from '../services/guild.service.js';

export default {
  name: Events.InteractionCreate,
  once: false,
  /**
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    if (!interaction.isCommand()) return;

    await interaction.deferReply({ ephemeral: true });

    const member = interaction.member;

    if (!member.permissions.has('ADMINISTRATOR'))
      return interaction.editReply({
        content: ':x: You are not an admin.',
        ephemeral: true,
      });

    const channel =
      interaction.options.getChannel('channel') || interaction.channel;

    const trackChannels = await getTrackChannels(interaction.guild.id);

    if (interaction.commandName === 'log') {
      // log
      const event = interaction.options.getSubcommand();
      await addToLoggingChannels(event, interaction.guild.id, channel.id);

      interaction.editReply(
        `:white_check_mark: Logging event \`${event}\` in ${channel}`
      );
    } else if (interaction.commandName === 'track') {
      // track
      if (trackChannels.indexOf(channel.id) !== -1) {
        return interaction.editReply({
          content: `:x: Already tracking ${channel.name}`,
          ephemeral: true,
        });
      }

      // add channel to guild's track_channels array
      await addToTrackChannels(interaction.guild.id, channel.id);

      await interaction.editReply({
        content: `:white_check_mark: Tracking ${channel.name}`,
        ephemeral: true,
      });
    } else if (interaction.commandName === 'untrack') {
      // untrack
      if (trackChannels.indexOf(channel.id) === -1) {
        return interaction.editReply({
          content: `:x: Not tracking ${channel.name}`,
          ephemeral: true,
        });
      }

      // remove channel from guild's track_channels array
      await removeFromTrackChannels(interaction.guild.id, channel.id);

      await interaction.editReply({
        content: `:white_check_mark: No longer tracking ${channel.name}`,
        ephemeral: true,
      });
    }
  },
};
