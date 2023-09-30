const { insertGuild } = require('../services/guild.service');
const { handleError } = require('../shared');

const Guild = require('../models/guild.model');

module.exports = {
  name: 'ready',
  once: true,
  /**
   * @param {import('discord.js').Client} client
   */
  async execute(client) {
    console.log(`[whistleblower] Logged in as ${client.user.tag}`);

    client.user.setActivity('you', { type: 'WATCHING' });

    client.guilds.cache.map(async guild =>  {
      try {
        const g = await Guild.findOne({ guild_id: guild.id }, '_id guild_id');
        if (!g) insertGuild(guild);
      } catch (err) {
        handleError(err);
      }
    });
  }
};
