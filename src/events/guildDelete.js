import { Events } from 'discord.js';

import { deleteGuild } from '../services/guild.service.js';

export default {
  name: Events.GuildDelete,
  once: false,
  /**
   * @param {import('discord.js').Guild} guild
   */
  async execute(guild) {
    await deleteGuild(guild.id);
  },
};
