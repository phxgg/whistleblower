const { deleteGuild } = require('../shared.js');

module.exports = {
  name: 'guildDelete',
  once: false,
  async execute(guild) {
    await deleteGuild(guild.id);
  }
};
