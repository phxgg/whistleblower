const { REST } = require('@discordjs/rest');
// const { Routes } = require('discord-api-types/v9');
const { Routes } = require('discord.js')
const path = require('node:path');

const { token, application_id } = require('../config.json');

const guild_id = process.argv[2];

if (!guild_id) {
  console.error('[whistleblower] ERROR: No guild ID provided');
  process.exit(1);
}

const fs = require('node:fs');

const commands = [];
const commandsPath = path.join(__dirname, '../src/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`[whistleblower] Started refreshing ${commands.length} application (/) commands.`)

    const data = await rest.put(
      Routes.applicationGuildCommands(application_id, guild_id),
      { body: commands },
    );

    console.log(`[whistleblower] Successfully reloaded ${data.length} application (/) commands.`);
  } catch (err) {
    console.error(err);
  }
})();
