const { Events } = require('discord.js');
const { insertGuild } = require('../services/guild.service');

module.exports = {
  name: Events.GuildCreate,
  once: false,
  /**
   * @param {import('discord.js').Guild} guild
   */
  async execute(guild) {
    await insertGuild(guild);
  }
};
