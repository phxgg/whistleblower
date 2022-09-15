const { insertGuild } = require('../services/guild.service');
const { handleError } = require('../shared');

const Guild = require('../models/guild.model');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[whistleblower] Logged in as ${client.user.tag}`);

    client.user.setActivity('you', { type: 'WATCHING' });

    const guilds = client.guilds.cache.map(async guild =>  {
      Guild.findOne({ guild_id: guild.id }, '_id guild_id', (err, g) => {
        if (err) return handleError(err);
        if (!g) insertGuild(guild);
      });
    });
  }
};
