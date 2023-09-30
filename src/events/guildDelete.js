const { deleteGuild } = require('../services/guild.service');

module.exports = {
  name: 'guildDelete',
  once: false,
  /**
   * @param {import('discord.js').Guild} guild
   */
  async execute(guild) {
    await deleteGuild(guild.id);
  }
};
