import { ChannelType, PermissionsBitField } from 'discord.js';

import config from '../../config.json' with { type: 'json' };
import Guild from '../models/guild.model.js';
import redisService from '../services/redis.service.js';
import { handleError } from '../shared.js';

/**
 * @param {string} guildId
 * @param {string} projection
 * @returns {Promise<Object>} guild object
 */
export async function getGuild(guildId, projection) {
  let g = await Guild.findOne({ guild_id: guildId }, projection).cache();
  if (!g) return {};
  return g;
}

/**
 * Inserts a new guild into the database
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<void>}
 */
export async function insertGuild(guild) {
  const guildObject = {
    guild_id: guild.id,
    guild_owner_id: guild.ownerId,
    guild_name: guild.name,
    logging_channels: {},
    track_channels: [],
  };

  if (config.track_all_channels_by_default) {
    const channels = await guild.channels.fetch();

    channels.map((channel) => {
      if (
        (channel.type === ChannelType.GuildText ||
          channel.type === ChannelType.GuildVoice) &&
        !config.exclude_channel_ids.includes(channel.id)
      ) {
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
}

/**
 * Deletes a guild from the database
 * @param {string} guildId
 * @returns {Promise<void>}
 */
export async function deleteGuild(guildId) {
  try {
    await Guild.deleteOne({ guild_id: guildId });
  } catch (err) {
    handleError(err);
  }
  redisService.clearKey(Guild.collection.collectionName);
}

/**
 * @param {string} guildId
 * @returns {Promise<Object>} logging channels object
 */
export async function getLoggingChannels(guildId) {
  let g = await Guild.findOne({ guild_id: guildId }, 'logging_channels')
    .exec()
    .catch((err) => handleError(err));
  if (!g) return {};
  return g.logging_channels;
}

/**
 * Adds a new logging channel to the database
 * @param {string} event
 * @param {string} guildId
 * @param {string} channelId
 * @returns {Promise<void>}
 */
export async function addToLoggingChannels(event, guildId, channelId) {
  const updateQuery = { $set: { [`logging_channels.${event}`]: channelId } };
  try {
    await Guild.updateOne({ guild_id: guildId }, updateQuery);
  } catch (err) {
    handleError(err);
  }
  redisService.clearKey(Guild.collection.collectionName);
}

/**
 * Get all track channels for a guild
 * @param {string} guildId
 * @returns {Promise<Array<string>>}
 */
export async function getTrackChannels(guildId) {
  let g = await Guild.findOne({ guild_id: guildId }, 'track_channels')
    .exec()
    .catch((err) => handleError(err));
  if (!g) return [];
  return g.track_channels;
}

/**
 * Adds a new channel, for tracking, to the database
 * @param {string} guildId
 * @param {string} channelId
 * @returns {Promise<void>}
 */
export async function addToTrackChannels(guildId, channelId) {
  const updateQuery = { $push: { track_channels: channelId } };
  try {
    await Guild.updateOne({ guild_id: guildId }, updateQuery);
  } catch (err) {
    handleError(err);
  }
  redisService.clearKey(Guild.collection.collectionName);
}

/**
 * Removes a tracking channel from the database
 * @param {string} guildId
 * @param {string} channelId
 * @returns {Promise<void>}
 */
export async function removeFromTrackChannels(guildId, channelId) {
  const updateQuery = { $pull: { track_channels: channelId } };
  try {
    await Guild.updateOne({ guild_id: guildId }, updateQuery);
  } catch (err) {
    handleError(err);
  }
  redisService.clearKey(Guild.collection.collectionName);
}

export async function createWhistleblowerCategory(guild) {
  try {
    // Create a new category in the Guild for whistleblower logging
    // This category should have a permission overwrite that denies @everyone from viewing it
    // and allows only users with the "Administrator" permission to view it
    // The category should also have two text channels called "message-deleted" and "message-edited"
    const loggingCategory = await guild.channels.create({
      name: '🕵Whistleblower',
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
      ],
    });

    /**
     * @type {Array<{channel: import('discord.js').GuildChannel, event: 'message_delete' | 'message_update'}>}
     */
    const channels = [];

    // Create the "message-deleted" channel
    const messageDeletedChannel = await guild.channels.create({
      name: '❌message-deleted',
      type: ChannelType.GuildText,
      parent: loggingCategory.id,
    });
    channels.push({
      channel: messageDeletedChannel,
      event: 'message_delete',
    });

    // Create the "message-edited" channel
    const messageEditedChannel = await guild.channels.create({
      name: '✍message-edited',
      type: ChannelType.GuildText,
      parent: loggingCategory.id,
    });
    channels.push({ channel: messageEditedChannel, event: 'message_update' });

    for (const obj of channels) {
      // Add the channel to the guild's logging_channels object in the database
      addToLoggingChannels(obj.event, guild.id, obj.channel.id);
      // Lock the permissions for the channel to match the category
      obj.channel
        .lockPermissions()
        .then(() => {
          console.log(
            `Locked permissions for channel ${obj.channel.name} in guild ${guild.name}`
          );
        })
        .catch((err) => {
          console.error(
            `Failed to lock permissions for channel ${obj.channel.name} in guild ${guild.name}:`,
            err
          );
        });
    }
  } catch (err) {
    handleError(err);
  }
}
