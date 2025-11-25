import { Events } from 'discord.js';

import { insertGuild } from '../services/guild.service.js';

export default {
  name: Events.GuildCreate,
  once: false,
  /**
   * @param {import('discord.js').Guild} guild
   */
  async execute(guild) {
    await insertGuild(guild);
  },
};
