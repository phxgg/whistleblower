const { insertGuild } = require('../services/guild.service');

module.exports = {
  name: 'guildCreate',
  once: false,
  /**
   * @param {import('discord.js').Guild} guild
   */
  async execute(guild) {
    await insertGuild(guild);
  }
};
