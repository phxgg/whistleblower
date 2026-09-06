import { ActivityType, Events } from 'discord.js';

import Guild from '../models/guild.model.js';
import { insertGuild } from '../services/guild.service.js';
import { createLogger } from '../services/logger.service.js';
import { handleError } from '../shared.js';

const logger = createLogger(import.meta);

export default {
  name: Events.ClientReady,
  once: true,
  /**
   * @param {import('discord.js').Client} client
   */
  async execute(client) {
    logger.info(`Logged in as ${client.user.tag}`);

    client.user.setActivity('you', { type: ActivityType.Watching });

    // catch up on the guilds joined while the bot was offline
    for (const guild of client.guilds.cache.values()) {
      try {
        const g = await Guild.findOne({ guild_id: guild.id }, '_id guild_id');
        if (!g) await insertGuild(guild);
      } catch (err) {
        handleError(err);
      }
    }
  },
};
