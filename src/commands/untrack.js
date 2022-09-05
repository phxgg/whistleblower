const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('untrack')
  .setDescription('Untrack a channel')
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('Channel to remove from tracking')
  );

module.exports = {
  data
};