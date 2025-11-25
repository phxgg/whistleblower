/**
 * This script will register all global commands for the bot.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';

import config from '../config.json' with { type: 'json' };

// const guild_id = process.argv[2];

// if (!guild_id) {
//   console.error('[whistleblower] ERROR: No guild ID provided');
//   process.exit(1);
// }

const commands = [];
const commandsPath = path.join(import.meta.dirname, '../src/commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const fileUrl = pathToFileURL(filePath).href;
  const command = await import(fileUrl);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log(
      `[whistleblower] Started refreshing ${commands.length} application (/) commands.`
    );

    const data = await rest.put(
      // Routes.applicationGuildCommands(config.application_id, guild_id),
      Routes.applicationCommands(config.application_id),
      { body: commands }
    );

    console.log(
      `[whistleblower] Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (err) {
    console.error(err);
  }
})();
