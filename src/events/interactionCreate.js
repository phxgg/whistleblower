import { Events, MessageFlags, PermissionsBitField } from 'discord.js';

import { handleError } from '../shared.js';

export default {
  name: Events.InteractionCreate,
  once: false,
  /**
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.editReply(':x: You are not an admin.');

    try {
      await command.execute(interaction);
    } catch (err) {
      handleError(err);
      await interaction.editReply(':x: Something went wrong.');
    }
  },
};
