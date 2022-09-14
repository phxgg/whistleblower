const { insertGuild } = require('../shared.js');

module.exports = {
  name: 'guildCreate',
  once: false,
  async execute(guild) {
    await insertGuild(guild);
  }
};
