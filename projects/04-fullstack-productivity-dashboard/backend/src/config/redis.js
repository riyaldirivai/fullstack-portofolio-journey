const redis = require("redis");
const logger = require("../utils/logger");

class RedisClient {
  constructor() {
    this.client = null;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
      });

      await this.client.connect();
      logger.info("Redis Connected Successfully");
    } catch (error) {
      logger.error("Redis connection error:", error);
    }
  }

  async get(key) {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error("Redis GET error:", error);
      return null;
    }
  }

  async set(key, value, expireTime = 3600) {
    try {
      await this.client.setEx(key, expireTime, JSON.stringify(value));
    } catch (error) {
      logger.error("Redis SET error:", error);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error("Redis DEL error:", error);
    }
  }
}

module.exports = new RedisClient();
