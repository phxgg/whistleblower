import { Events } from 'discord.js';

import { editedMessageEmbed } from '../embeds.js';
import { resolveLoggingChannel, sendToLoggingChannel } from '../services/guild.service.js';

export default {
  name: Events.MessageUpdate,
  once: false,
  /**
   * @param {import('discord.js').Message} oldMessage
   * @param {import('discord.js').Message} newMessage
   */
  async execute(oldMessage, newMessage) {
    if (oldMessage.partial || newMessage.partial) return; // content is null
    if (oldMessage.author.bot) return; // ignore bots

    // nothing changed
    if (oldMessage.content === newMessage.content && oldMessage.attachments.size === newMessage.attachments.size)
      return;

    const loggingChannelId = await resolveLoggingChannel(oldMessage.guild.id, 'message_update', newMessage.channel.id);
    if (!loggingChannelId) return;

    const embed = await editedMessageEmbed(oldMessage, newMessage);

    await sendToLoggingChannel(newMessage.client, newMessage.guild.id, loggingChannelId, embed);
  },
};
