const { ChannelType } = require('discord.js');
const {
  track_all_channels_by_default,
  exclude_channel_ids
} = require('../../config.json');
// const { trackChannels } = require('../shared.js');
const db = require('../db.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[whistleblower] Logged in as ${client.user.tag}`);

    client.user.setActivity('you', { type: 'WATCHING' });

    try {
      const database = db.db('whistleblower');
      const guildsCollection = database.collection('guilds');

      const guilds = client.guilds.cache.map(async guild => {
        const findGuild = await guildsCollection.findOne(
          { guild_id: guild.id },
          {
            projection: { _id: 0, guild_id: 1, track_channels: 1 }
          }
        );

        if (!findGuild) {
          let guildObject = {
            guild_id: guild.id,
            guild_owner_id: guild.ownerId,
            guild_name: guild.name,
            track_channels: []
          };
  
          if (track_all_channels_by_default) {
            const channels = await guild.channels.fetch();
    
            await channels.map(channel => {
              if ((channel.type === ChannelType.GuildText
                || channel.type === ChannelType.GuildVoice)
                && !exclude_channel_ids.includes(channel.id)) {
                guildObject.track_channels.push(channel.id);
              }
            });
          }

          const options = { ordered: true };
          const result = await guildsCollection.insertOne(guildObject, options);
          console.log(`[whistleblower] Inserted guild ${result.insertedId} into the collection`);
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      await db.close();
    }
  }
};
