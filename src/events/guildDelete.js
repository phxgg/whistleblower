const { Events } = require('discord.js');
const { deleteGuild } = require('../services/guild.service');

module.exports = {
  name: Events.GuildDelete,
  once: false,
  /**
   * @param {import('discord.js').Guild} guild
   */
  async execute(guild) {
    await deleteGuild(guild.id);
  }
};
