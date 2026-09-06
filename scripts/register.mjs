/**
 * This script will register all global commands for the bot.
 */

import path from 'node:path';

import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';

import config from '../src/config.js';
import { loadModules } from '../src/shared.js';

const modules = await loadModules(path.join(import.meta.dirname, '../src/commands'));
const commands = modules.map((command) => command.data.toJSON());

const rest = new REST({ version: '10' }).setToken(config.token);

try {
  console.log(`[whistleblower] Started refreshing ${commands.length} application (/) commands.`);

  const data = await rest.put(Routes.applicationCommands(config.application_id), { body: commands });

  console.log(`[whistleblower] Successfully reloaded ${data.length} application (/) commands.`);
} catch (err) {
  console.error(err);
}
