const { deleteGuild } = require('../services/guild.service');

module.exports = {
  name: 'guildDelete',
  once: false,
  async execute(guild) {
    await deleteGuild(guild.id);
  }
};
