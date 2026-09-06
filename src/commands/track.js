import { InteractionContextType, SlashCommandBuilder } from 'discord.js';

import {
  addToTrackChannels,
  getTrackChannels,
  removeFromTrackChannels,
  trackableChannelIds,
} from '../services/guild.service.js';
import { parseIds } from '../shared.js';

export const data = new SlashCommandBuilder()
  .setName('track')
  .setDescription('Track a channel')
  .setContexts([InteractionContextType.Guild])
  .addChannelOption((option) => option.setName('channel').setDescription('Channel to keep track of'))
  .addBooleanOption((option) => option.setName('all').setDescription('Track every text and voice channel of the guild'))
  .addStringOption((option) =>
    option.setName('exclude').setDescription('Channels to skip when using all (mentions or ids)')
  );

/**
 * Shared implementation of `/track` and `/untrack`
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {boolean} tracking true to track, false to untrack
 */
export async function setTracking(interaction, tracking) {
  const guildId = interaction.guild.id;
  const trackChannels = await getTrackChannels(guildId);

  if (interaction.options.getBoolean('all')) {
    const excluded = parseIds(interaction.options.getString('exclude'));
    // Tracking looks at every eligible channel, untracking only at what is currently tracked.
    const channelIds = tracking
      ? (await trackableChannelIds(interaction.guild, excluded)).filter((id) => !trackChannels.includes(id))
      : trackChannels.filter((id) => !excluded.includes(id));

    if (channelIds.length === 0) {
      return interaction.editReply(`:x: No channels left to ${interaction.commandName}.`);
    }

    if (tracking) await addToTrackChannels(guildId, channelIds);
    else await removeFromTrackChannels(guildId, channelIds);

    return interaction.editReply(
      `:white_check_mark: ${tracking ? 'Tracking' : 'No longer tracking'} ${channelIds.length} channel(s).`
    );
  }

  const channel = interaction.options.getChannel('channel') || interaction.channel;

  if (trackChannels.includes(channel.id) === tracking) {
    return interaction.editReply(
      tracking ? `:x: Already tracking ${channel.name}` : `:x: Not tracking ${channel.name}`
    );
  }

  if (tracking) await addToTrackChannels(guildId, channel.id);
  else await removeFromTrackChannels(guildId, channel.id);

  return interaction.editReply(
    tracking ? `:white_check_mark: Tracking ${channel.name}` : `:white_check_mark: No longer tracking ${channel.name}`
  );
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  return setTracking(interaction, true);
}
