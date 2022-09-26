const { ChannelType } = require('discord.js');
const { handleError } = require('../shared');
const redisService = require('../services/redis.service');
const Guild = require('../models/guild.model.js');

const {
  track_all_channels_by_default,
  exclude_channel_ids
} = require('../../config.json');

const getGuild = async (guildId, projection) => {
  let g = await Guild.findOne({ guild_id: guildId }, projection).cache();
  if (!g) return {};
  return g;
};

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
  g.save((err) => {
    if (err) return handleError(err);
  });
};

const deleteGuild = async (guildId) => {
  Guild.deleteOne({ guild_id: guildId }, (err) => {
    if (err) return handleError(err);
  });

  redisService.clearKey(Guild.collection.collectionName);
};

const getLoggingChannels = async (guildId) => {
  // Guild.findOne({ guild_id: guildId }, 'logging_channels', (err, guild) => {
  //   if (err) return handleError(err);
  //   if (!guild) return {};
  //   return guild.logging_channels;
  // });

  let g = await Guild.findOne({ guild_id: guildId }, 'logging_channels').exec().catch(err => handleError(err));
  if (!g) return {};
  return g.logging_channels;
};

const addToLoggingChannels = async (event, guildId, channelId) => {
  const update = { $set: { [`logging_channels.${event}`]: channelId } };

  Guild.updateOne({ guild_id: guildId }, update, (err, guild) => {
    if (err) return handleError(err);
  });

  redisService.clearKey(Guild.collection.collectionName);
};

const getTrackChannels = async (guildId) => {
  let g = await Guild.findOne({ guild_id: guildId }, 'track_channels').exec().catch(err => handleError(err));
  if (!g) return [];
  return g.track_channels;
};

const addToTrackChannels = async (guildId, channelId) => {
  const update = { $push: { track_channels: channelId } };

  Guild.updateOne({ guild_id: guildId }, update, (err, guild) => {
    if (err) return handleError(err);
  });

  redisService.clearKey(Guild.collection.collectionName);
};

const removeFromTrackChannels = async (guildId, channelId) => {
  const update = { $pull: { track_channels: channelId } };

  Guild.updateOne({ guild_id: guildId }, update, (err, guild) => {
    if (err) return handleError(err);
  });

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
