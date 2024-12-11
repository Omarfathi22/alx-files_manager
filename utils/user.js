import redisClient from './redis';
import dbClient from './db';

/**
 * Module providing user-related utilities, including fetching user data
 * from Redis and a database.
 */
const userUtils = {
    /**
     * Retrieves the user ID and corresponding Redis key for authentication token.
     * Looks for an 'X-Token' header in the request and uses it to fetch the user ID
     * stored in Redis.
     * @param {object} request - The Express request object containing headers.
     * @return {Promise<object>} An object containing:
     *   - userId: The ID of the user from Redis (or null if not found).
     *   - key: The Redis key used to fetch the user ID.
     */
    async getUserIdAndKey(request) {
        const obj = { userId: null, key: null };

        // Retrieve the token from the X-Token header
        const xToken = request.header('X-Token');

        // If no token is provided, return the default empty object
        if (!xToken) return obj;

        // Generate the Redis key using the token
        obj.key = `auth_${xToken}`;

        // Fetch the userId from Redis using the generated key
        obj.userId = await redisClient.get(obj.key);

        return obj;
    },

    /**
     * Fetches a user document from the database based on the provided query.
     * @param {object} query - A query expression used to find the user in the database.
     * @return {Promise<object>} The user document from the database (or null if not found).
     */
    async getUser(query) {
        // Query the database to find a matching user
        const user = await dbClient.usersCollection.findOne(query);
        return user;
    },
};

export default userUtils;
