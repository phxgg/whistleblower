const path = require('node:path');
const fs = require('node:fs');

const {
  Client,
  GatewayIntentBits,
} = require('discord.js');

const {
  token,
  logging_channel_ids
} = require('../config.json');
const Paginator = require('./paginator.js');
const db = require('./db');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER'],
});

if (!logging_channel_ids.message_deleted || !logging_channel_ids.message_edited) {
  console.error('[whistleblower] ERROR: All logging channel IDs need to be provided.');
  process.exit(1);
}

// prevent exit on error
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);
process.on('beforeExit', (code) => {
  console.log('closing db connection');
  db.close();
});

// capture errors
client.on('error', (e) => console.error(e));
client.on('warn', (e) => console.warn(e));
// client.on('debug', (e) => console.info(e));

// load all event files
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once)
    client.once(event.name, (...args) => event.execute(...args));
  else
    client.on(event.name, (...args) => event.execute(...args));
}

// start
client.login(token);
