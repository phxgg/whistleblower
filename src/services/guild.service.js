import { ChannelType, PermissionsBitField, RESTJSONErrorCodes } from 'discord.js';

import config from '../config.js';
import Guild from '../models/guild.model.js';
import redisService from '../services/redis.service.js';
import { handleError } from '../shared.js';

/**
 * Every event that can be assigned a logging channel.
 * @type {Array<'message_delete' | 'message_update'>}
 */
export const LOG_EVENTS = ['message_delete', 'message_update'];

/**
 * Ids of the channels of a guild that are eligible for tracking.
 * @param {import('discord.js').Guild} guild
 * @param {Array<string>} excludeIds extra ids to skip, on top of `EXCLUDE_CHANNEL_IDS`
 * @returns {Promise<Array<string>>}
 */
export async function trackableChannelIds(guild, excludeIds = []) {
  const channels = await guild.channels.fetch();

  return channels
    .filter(
      (channel) =>
        channel &&
        (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildVoice) &&
        !config.exclude_channel_ids.includes(channel.id) &&
        !excludeIds.includes(channel.id)
    )
    .map((channel) => channel.id);
}

/**
 * @param {string} guildId
 * @param {string} projection
 * @returns {Promise<Object | null>} guild object
 */
export async function getGuild(guildId, projection) {
  let g = await Guild.findOne({ guild_id: guildId }, projection).cache();
  if (!g) return null;
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
    guildObject.track_channels = await trackableChannelIds(guild);
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
 * @returns {Promise<Object | null>} logging channels object
 */
export async function getLoggingChannels(guildId) {
  let g = await Guild.findOne({ guild_id: guildId }, 'logging_channels')
    .exec()
    .catch((err) => handleError(err));
  if (!g) return null;
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
 * Adds one or more channels, for tracking, to the database
 * @param {string} guildId
 * @param {string | Array<string>} channelIds
 * @returns {Promise<void>}
 */
export async function addToTrackChannels(guildId, channelIds) {
  const updateQuery = { $addToSet: { track_channels: { $each: [].concat(channelIds) } } };
  try {
    await Guild.updateOne({ guild_id: guildId }, updateQuery);
  } catch (err) {
    handleError(err);
  }
  redisService.clearKey(Guild.collection.collectionName);
}

/**
 * Removes one or more tracking channels from the database
 * @param {string} guildId
 * @param {string | Array<string>} channelIds
 * @returns {Promise<void>}
 */
export async function removeFromTrackChannels(guildId, channelIds) {
  const updateQuery = { $pull: { track_channels: { $in: [].concat(channelIds) } } };
  try {
    await Guild.updateOne({ guild_id: guildId }, updateQuery);
  } catch (err) {
    handleError(err);
  }
  redisService.clearKey(Guild.collection.collectionName);
}

/**
 * Forgets a channel that no longer exists: stops tracking it and unsets every logging event pointing at it
 * @param {string} guildId
 * @param {string} channelId
 * @returns {Promise<void>}
 */
export async function removeChannel(guildId, channelId) {
  const loggingChannels = (await getLoggingChannels(guildId)) || {};
  const events = LOG_EVENTS.filter((event) => loggingChannels[event] === channelId);

  const updateQuery = { $pull: { track_channels: channelId } };
  if (events.length > 0) {
    updateQuery.$unset = Object.fromEntries(events.map((event) => [`logging_channels.${event}`, '']));
  }

  try {
    await Guild.updateOne({ guild_id: guildId }, updateQuery);
  } catch (err) {
    handleError(err);
  }
  redisService.clearKey(Guild.collection.collectionName);
}

/**
 * Sends an embed to a logging channel, forgetting the channel if it has been deleted in the meantime
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 * @param {string} channelId
 * @param {import('discord.js').EmbedBuilder} embed
 * @returns {Promise<void>}
 */
export async function sendToLoggingChannel(client, guildId, channelId, embed) {
  try {
    const channel = await client.channels.fetch(channelId);
    await channel.send({ embeds: [embed] });
  } catch (err) {
    if (err.code === RESTJSONErrorCodes.UnknownChannel) {
      await removeChannel(guildId, channelId);
      return;
    }
    handleError(err);
  }
}

/**
 * Creates a new Admin-only category in the Guild for whistleblower logging
 * @param {import('discord.js').Guild} guild
 */
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
     * @type {Array<{channel: import('discord.js').TextChannel, event: 'message_delete' | 'message_update'}>}
     */
    const eventToChannelMap = [];

    // Create the "message-deleted" channel
    const messageDeletedChannel = await guild.channels.create({
      name: '❌message-deleted',
      type: ChannelType.GuildText,
      parent: loggingCategory.id,
    });
    eventToChannelMap.push({
      channel: messageDeletedChannel,
      event: 'message_delete',
    });

    // Create the "message-edited" channel
    const messageEditedChannel = await guild.channels.create({
      name: '✍message-edited',
      type: ChannelType.GuildText,
      parent: loggingCategory.id,
    });
    eventToChannelMap.push({ channel: messageEditedChannel, event: 'message_update' });

    for (const x of eventToChannelMap) {
      // Add the channel to the guild's logging_channels object in the database
      addToLoggingChannels(x.event, guild.id, x.channel.id);
      // Lock the permissions for the channel to match the category
      x.channel
        .lockPermissions()
        .then(() => {
          console.log(`Locked permissions for channel ${x.channel.name} in guild ${guild.name}`);
        })
        .catch((err) => {
          console.error(`Failed to lock permissions for channel ${x.channel.name} in guild ${guild.name}:`, err);
        });
    }
  } catch (err) {
    handleError(err);
  }
}
