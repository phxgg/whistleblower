const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');

const {
  redis_enable,
  redis_host,
  redis_port
} = require('../../config.json');

const redisClient = redis.createClient({
  host: redis_host,
  port: redis_port,
  retry_strategy: () => 1000
});

// Call this only once
const setup = () => {
  if (!redis_enable) {
    mongoose.Query.prototype.cache = function() {
      return this;
    };
    return;
  }

  redisClient.connect();

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

      console.log('Response from Redis');
      return Array.isArray(doc)
        ? doc.map(d => new this.model(d))
        : new this.model(doc);
    }

    const result = await exec.apply(this, arguments);
    redisClient.hSet(this.hashKey, key, JSON.stringify(result));
    redisClient.expire(this.hashKey, this.time);

    console.log('Response from MongoDB');
    return result;
  };
};

const clearKey = (hashKey) => {
  if (!redis_enable) return;
  redisClient.del(JSON.stringify(hashKey));
};

const disconnect = () => {
  if (!redis_enable) return;
  redisClient.disconnect();
}

module.exports = {
  setup,
  clearKey,
  disconnect,
};
