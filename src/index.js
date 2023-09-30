const path = require('node:path');
const fs = require('node:fs');
const logger = require('./services/logger.service')(module);
const mongoose = require('mongoose');
const redisService = require('./services/redis.service'); // define a variable so code gets executed once

const {
  Client,
  GatewayIntentBits,
} = require('discord.js');

const {
  token,
  mongodb_uri
} = require('../config.json');

// const Paginator = require('./paginator.js');

redisService.setup();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER'],
});

// MongoDB Database Connection
mongoose.connect(mongodb_uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  logger.info('Successfully connected to db.');
}).catch(err => {
  logger.error(`Could not connect to db: ${err}`);
  process.exit();
});

// prevent exit on error
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);
process.on('beforeExit', (code) => {
  logger.info('Closing db connection.');
  redisService.disconnect();
  mongoose.connection.close();
});

// capture errors
client.on('error', (e) => logger.error(e));
client.on('warn', (e) => logger.warn(e));
// client.on('debug', (e) => console.info(e));

// load all event files
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  }
  else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// start
client.login(token);
