/**
 * This script will delete all global commands for the bot.
 */

import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';
import config from '../config.json' with { type: 'json' };

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    const data = await rest.put(
      Routes.applicationCommands(config.application_id),
      { body: [] },
    );

    console.log(`[whistleblower] Successfully deleted all application (/) commands.`);
  } catch (err) {
    console.error(err);
  }
})();
