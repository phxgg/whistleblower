import { Events } from 'discord.js';

import {
  createWhistleblowerCategory,
  insertGuild,
} from '../services/guild.service.js';

export default {
  name: Events.GuildCreate,
  once: false,
  /**
   * @param {import('discord.js').Guild} guild
   */
  async execute(guild) {
    // When the bot joins a new guild, insert it into the database
    await insertGuild(guild);
    // Create Whistleblower category
    await createWhistleblowerCategory(guild);
  },
};
