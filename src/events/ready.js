import { Events } from 'discord.js';

import Guild from '../models/guild.model.js';
import { insertGuild } from '../services/guild.service.js';
import { handleError } from '../shared.js';

export default {
  name: Events.ClientReady,
  once: true,
  /**
   * @param {import('discord.js').Client} client
   */
  async execute(client) {
    console.log(`[whistleblower] Logged in as ${client.user.tag}`);

    client.user.setActivity('you', { type: 'WATCHING' });

    client.guilds.cache.map(async (guild) => {
      try {
        const g = await Guild.findOne({ guild_id: guild.id }, '_id guild_id');
        if (!g) insertGuild(guild);
      } catch (err) {
        handleError(err);
      }
    });
  },
};
