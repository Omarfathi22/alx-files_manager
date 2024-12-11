import redis from 'redis';
import { promisify } from 'util';

/**
 * Class to handle Redis operations such as connecting, retrieving, 
 * setting, and deleting keys with TTL support.
 */
class RedisClient {
    constructor() {
        // Create a new Redis client and promisify the 'get' method
        this.client = redis.createClient();
        this.getAsync = promisify(this.client.get).bind(this.client);

        // Handle Redis connection errors
        this.client.on('error', (error) => {
            console.log(`Redis client not connected to the server: ${error.message}`);
        });

        // Handle Redis successful connection (no logging here currently)
        this.client.on('connect', () => {
            // console.log('Redis client connected to the server');
        });
    }

    /**
     * Checks if the connection to Redis server is alive.
     * @return {boolean} true if the connection is alive, false otherwise
     */
    isAlive() {
        return this.client.connected;
    }

    /**
     * Retrieves the value associated with a key from the Redis store.
     * @param {string} key - The key to search for in Redis.
     * @return {Promise<string>} - The value associated with the key, or null if the key doesn't exist.
     */
    async get(key) {
        const value = await this.getAsync(key);
        return value;
    }

    /**
     * Sets a new key-value pair in Redis with a specified TTL (Time-To-Live).
     * The key will automatically expire after the specified duration.
     * @param {string} key - The key to store in Redis.
     * @param {string} value - The value to associate with the key.
     * @param {number} duration - The TTL in seconds before the key expires.
     * @return {Promise<void>} - This method does not return any value.
     */
    async set(key, value, duration) {
        this.client.setex(key, duration, value);
    }

    /**
     * Deletes a key-value pair from the Redis store.
     * @param {string} key - The key to delete from Redis.
     * @return {Promise<void>} - This method does not return any value.
     */
    async del(key) {
        this.client.del(key);
    }
}

// Create an instance of RedisClient for use in the application
const redisClient = new RedisClient();

export default redisClient;
