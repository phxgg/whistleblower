import mongoose from 'mongoose';
import redis from 'redis';
import { createLogger } from './logger.service.js';
import config from '../../config.json' with { type: 'json' };

const logger = createLogger(import.meta);

const redisClient = redis.createClient({
  host: config.redis.host,
  port: config.redis.port,
  retry_strategy: () => 1000
});

/**
 * Call this function only once in the application
 * Setups the redis cache for mongoose
 */
const setup = () => {
  if (!config.redis.enable) {
    mongoose.Query.prototype.cache = function() {
      return this;
    };
    return;
  }

  redisClient.connect().then(() => {
    logger.info('Redis connected');
  }).catch(err => {
    logger.error(`Could not connect to redis: ${err}`);
    process.exit();
  });

  // redisClient.hGet = util.promisify(redisClient.hGet);
  const exec = mongoose.Query.prototype.exec;

  mongoose.Query.prototype.cache = function (options = { time: 60 }) {
    this.useCache = true;
    this.time = options.time;
    this.hashKey = JSON.stringify(options.key || this.mongooseCollection.name);
    return this;
  };

  mongoose.Query.prototype.exec = async function() {
    if (!this.useCache) {
      return await exec.apply(this, arguments);
    }

    const key = JSON.stringify({
      ...this.getQuery()
    });

    const cacheValue = await redisClient.hGet(this.hashKey, key);

    if (cacheValue) {
      const doc = JSON.parse(cacheValue);

      logger.info('Response from Redis');
      return Array.isArray(doc)
        ? doc.map(d => new this.model(d))
        : new this.model(doc);
    }

    const result = await exec.apply(this, arguments);
    redisClient.hSet(this.hashKey, key, JSON.stringify(result));
    redisClient.expire(this.hashKey, this.time);

    logger.info('Response from MongoDB');
    return result;
  };
};

/**
 * Clears the cache for the given hashKey
 * @param {string} hashKey
 */
const clearKey = (hashKey) => {
  if (!redis_enable) return;
  redisClient.del(JSON.stringify(hashKey));
};

/**
 * Disconnect from redis
 */
const disconnect = () => {
  if (!redis_enable) return;
  logger.info('Closing redis connection');
  redisClient.destroy();
};

export default {
  setup,
  clearKey,
  disconnect,
}
