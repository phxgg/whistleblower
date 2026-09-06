import path from 'node:path';

import { Client, GatewayIntentBits, Partials } from 'discord.js';
import mongoose from 'mongoose';

import config from './config.js';
import { createLogger } from './services/logger.service.js';
import redisService from './services/redis.service.js';
import { loadModules } from './shared.js';

const logger = createLogger(import.meta);

redisService.setup();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember],
});

// MongoDB Database Connection
mongoose
  .connect(config.mongodb_uri)
  .then(() => {
    logger.info('Successfully connected to db.');
  })
  .catch((err) => {
    logger.error(`Could not connect to db: ${err}`);
    process.exit();
  });

// prevent exit on error
process.on('unhandledRejection', (err) => logger.error(err));
process.on('uncaughtException', (err) => logger.error(err));
process.on('beforeExit', () => {
  logger.info('Closing db connection.');
  redisService.disconnect();
  mongoose.connection.close();
});

// capture errors
client.on('error', (e) => logger.error(e));
client.on('warn', (e) => logger.warn(e));
// client.on('debug', (e) => console.info(e));

// load all command files, keyed by command name so interactionCreate can dispatch to them
client.commands = new Map();
for (const command of await loadModules(path.join(import.meta.dirname, 'commands'))) {
  client.commands.set(command.data.name, command);
}

// load all event files
for (const module of await loadModules(path.join(import.meta.dirname, 'events'))) {
  const event = module.default;

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// start
client.login(config.token);
