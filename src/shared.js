const db = require('./db.js');

const getTrackChannels = async (guildId) => {
  try {
    const database = db.db('whistleblower');
    const guildsCollection = database.collection('guilds');

    const findGuild = await guildsCollection.findOne(
      { guild_id: guildId },
      {
        projection: { _id: 0, guild_id: 1, track_channels: 1 }
      }
    );

    if (!findGuild) return [];

    return findGuild.track_channels;
  } catch (err) {
    console.error(err);
  }
};

const addToTrackChannels = async (guildId, channelId) => {
  try {
    const database = db.db('whistleblower');
    const guildsCollection = database.collection('guilds');

    const findGuild = await guildsCollection.findOne(
      { guild_id: guildId },
      {
        projection: { _id: 0, guild_id: 1, track_channels: 1 }
      }
    );

    // if channel is already being tracked, return
    if (!findGuild || findGuild.track_channels.includes(channelId)) return;

    // otherwise update the guild's track_channels array
    const updateGuild = await guildsCollection.updateOne(
      { guild_id: guildId },
      { $push: { track_channels: channelId } }
    );

    console.log(`[whistleblower] Updated guild ${updateGuild.matchedCount} in the collection`);
  } catch (err) {
    console.error(err);
  }
};

const removeFromTrackChannels = async (guildId, channelId) => {
  try {
    const database = db.db('whistleblower');
    const guildsCollection = database.collection('guilds');

    const findGuild = await guildsCollection.findOne(
      { guild_id: guildId },
      {
        projection: { _id: 0, guild_id: 1, track_channels: 1 }
      }
    );

    // if channel is not being tracked, return
    if (!findGuild || !findGuild.track_channels.includes(channelId)) return;

    // otherwise update the guild's track_channels array
    const updateGuild = await guildsCollection.updateOne(
      { guild_id: guildId },
      { $pull: { track_channels: channelId } }
    );

    console.log(`[whistleblower] Updated guild ${updateGuild.matchedCount} in the collection`);
  } catch (err) {
    console.error(err);
  }
};

const formatEmoji = (emoji) => {
  return !emoji.id || emoji.available
    ? emoji.toString() // bot has access to unicode emoji
    : `[:${emoji.name}:](${emoji.url})`; // bot cannot use the emoji
};

module.exports = {
  getTrackChannels,
  addToTrackChannels,
  removeFromTrackChannels,
  formatEmoji
};
