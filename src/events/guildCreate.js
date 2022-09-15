const { insertGuild } = require('../services/guild.service');

module.exports = {
  name: 'guildCreate',
  once: false,
  async execute(guild) {
    await insertGuild(guild);
  }
};
