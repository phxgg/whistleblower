const { insertNewGuild } = require('../shared.js');
const db = require('../db.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[whistleblower] Logged in as ${client.user.tag}`);

    client.user.setActivity('you', { type: 'WATCHING' });

    const database = db.db('whistleblower');

    try {
      const guildsCollection = database.collection('guilds');

      const guilds = client.guilds.cache.map(async guild => {
        const findGuild = await guildsCollection.findOne(
          { guild_id: guild.id },
          {
            projection: { _id: 0, guild_id: 1 }
          }
        );

        // if guild was not found, insert it
        if (!findGuild) {
          await insertGuild(guild);
        }
      });
    } catch (err) {
      console.error(err);
    }
  }
};
