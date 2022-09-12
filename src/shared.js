const db = require('./db.js');
const database = db.db('whistleblower');

const {
  track_all_channels_by_default,
  exclude_channel_ids
} = require('../config.json');
const { ChannelType } = require('discord.js');

const insertNewGuild = async (guild) => {
  try {
    const guildsCollection = database.collection('guilds');

    const guildObject = {
      guild_id: guild.id,
      guild_owner_id: guild.ownerId,
      guild_name: guild.name,
      logging_channels: {},
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
    // console.log(`[whistleblower] Inserted guild ${result.insertedId} into the collection`);
  } catch (err) {
    console.error(err);
  }
};

const getLoggingChannels = async (guildId) => {
  try {
    const guildsCollection = database.collection('guilds');

    const findGuild = await guildsCollection.findOne(
      { guild_id: guildId },
      {
        projection: { _id: 0, guild_id: 1, logging_channels: 1 }
      }
    );

    if (!findGuild) return {};
    
    return findGuild.logging_channels;
  } catch (err) {
    console.error(err);
  }
};

const addToLoggingChannels = async (event, guildId, channelId) => {
  try {
    const guildsCollection = database.collection('guilds');

    const findGuild = await guildsCollection.findOne(
      { guild_id: guildId },
      {
        projection: { _id: 0, guild_id: 1, logging_channels: 1 }
      }
    );

    if (!findGuild) return;

    const updateGuild = await guildsCollection.updateOne(
      { guild_id: guildId },
      { $set: { [`logging_channels.${event}`]: channelId } }
    );

    // console.log(`[whistleblower] Updated guild ${updateGuild.matchedCount} in the collection`);
  } catch (err) {
    console.error(err);
  }
};

const getTrackChannels = async (guildId) => {
  try {
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
  insertNewGuild,
  getLoggingChannels,
  addToLoggingChannels,
  getTrackChannels,
  addToTrackChannels,
  removeFromTrackChannels,
  formatEmoji
};
