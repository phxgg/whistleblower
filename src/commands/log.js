const { SlashCommandBuilder, ChannelType } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('log')
  .setDescription('Setup a logging channel for a specific event')
  .setDMPermission(false)
  .addSubcommand(subcommand =>
    subcommand
      .setName('message_delete')
      .setDescription('Setup a logging channel for deleted messages')
      .addChannelOption(option =>
        option
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
          .setName('channel')
          .setDescription('Channel to log deleted messages')
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('message_update')
      .setDescription('Setup a logging channel for edited messages')
      .addChannelOption(option =>
        option
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
          .setName('channel')
          .setDescription('Channel to log edited messages')
      )
  );

module.exports = {
  data
};
