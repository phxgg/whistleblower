/**
 * This script will delete all global commands for the bot.
 */

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js')
const path = require('node:path');

const { token, application_id } = require('../config.json');

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`[whistleblower] Started deleting ${commands.length} application (/) commands.`)

    const data = await rest.put(
      Routes.applicationCommands(application_id),
      { body: [] },
    );

    console.log(`[whistleblower] Successfully deleted ${data.length} application (/) commands.`);
  } catch (err) {
    console.error(err);
  }
})();
