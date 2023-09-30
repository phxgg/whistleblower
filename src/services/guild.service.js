const { ChannelType } = require('discord.js');
const { handleError } = require('../shared');
const redisService = require('../services/redis.service');
const Guild = require('../models/guild.model.js');

const {
  track_all_channels_by_default,
  exclude_channel_ids
} = require('../../config.json');

/**
 * @param {string} guildId
 * @param {string} projection
 * @returns {Object} guild object
 */
const getGuild = async (guildId, projection) => {
  let g = await Guild.findOne({ guild_id: guildId }, projection).cache();
  if (!g) return {};
  return g;
};

/**
 * Inserts a new guild into the database
 * @param {import('discord.js').Guild} guild
 */
const insertGuild = async (guild) => {
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

  const g = new Guild(guildObject);
  try {
    await g.save();
  } catch (err) {
    handleError(err);
  }
};

/**
 * Deletes a guild from the database
 * @param {string} guildId
 */
const deleteGuild = async (guildId) => {
  try {
    await Guild.deleteOne({ guild_id: guildId });
  } catch (err) {
    handleError(err);
  }
  redisService.clearKey(Guild.collection.collectionName);
};

/**
 * @param {string} guildId
 * @returns {Object} logging channels object
 */
const getLoggingChannels = async (guildId) => {
  let g = await Guild.findOne({ guild_id: guildId }, 'logging_channels').exec().catch(err => handleError(err));
  if (!g) return {};
  return g.logging_channels;
};

/**
 * Adds a new logging channel to the database
 * @param {string} event
 * @param {string} guildId
 * @param {string} channelId
 */
const addToLoggingChannels = async (event, guildId, channelId) => {
  const updateQuery = { $set: { [`logging_channels.${event}`]: channelId } };
  try {
    await Guild.updateOne({ guild_id: guildId }, updateQuery);
  } catch (err) {
    handleError(err);
  }
  redisService.clearKey(Guild.collection.collectionName);
};

/**
 * Get all track channels for a guild
 * @param {string} guildId
 * @returns {Array<string>}
 */
const getTrackChannels = async (guildId) => {
  let g = await Guild.findOne({ guild_id: guildId }, 'track_channels').exec().catch(err => handleError(err));
  if (!g) return [];
  return g.track_channels;
};

/**
 * Adds a new channel, for tracking, to the database
 * @param {string} guildId
 * @param {string} channelId
 */
const addToTrackChannels = async (guildId, channelId) => {
  const updateQuery = { $push: { track_channels: channelId } };
  try {
    await Guild.updateOne({ guild_id: guildId }, updateQuery);
  } catch (err) {
    handleError(err);
  }
  redisService.clearKey(Guild.collection.collectionName);
};

/**
 * Removes a tracking channel from the database
 * @param {string} guildId
 * @param {string} channelId
 */
const removeFromTrackChannels = async (guildId, channelId) => {
  const updateQuery = { $pull: { track_channels: channelId } };
  try {
    await Guild.updateOne({ guild_id: guildId }, updateQuery);
  } catch (err) {
    handleError(err);
  }
  redisService.clearKey(Guild.collection.collectionName);
};

module.exports = {
  getGuild,
  insertGuild,
  deleteGuild,
  getLoggingChannels,
  addToLoggingChannels,
  getTrackChannels,
  addToTrackChannels,
  removeFromTrackChannels
};
