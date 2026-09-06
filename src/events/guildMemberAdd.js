import { Events } from 'discord.js';

import config from '../config.js';
import { createLogger } from '../services/logger.service.js';

const logger = createLogger(import.meta);

export default {
  name: Events.GuildMemberAdd,
  once: false,
  /**
   * @param {import('discord.js').GuildMember} member
   */
  async execute(member) {
    if (!config.banned_user_ids.includes(member.id)) return;

    try {
      await member.ban({ reason: 'Banned user tried to join the server' });
      logger.info(`Banned ${member.user.username} for being a banned user.`);
    } catch (err) {
      logger.error(`Failed to ban ${member.user.username}: ${err}`);
    }
  },
};
