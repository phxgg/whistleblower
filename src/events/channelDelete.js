import { Events } from 'discord.js';

import { removeChannel } from '../services/guild.service.js';

export default {
  name: Events.ChannelDelete,
  once: false,
  /**
   * @param {import('discord.js').DMChannel | import('discord.js').GuildChannel} channel
   */
  async execute(channel) {
    if (!channel.guild) return; // not a guild channel
    await removeChannel(channel.guild.id, channel.id);
  },
};
