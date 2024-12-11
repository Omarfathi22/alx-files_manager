import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
    /**
     * Returns the status of Redis and the database.
     * Response format: { "redis": true/false, "db": true/false }
     * HTTP Status: 200
     */
    static getStatus(request, response) {
        try {
            const status = {
                redis: redisClient.isAlive(),
                db: dbClient.isAlive(),
            };
            response.status(200).json(status);
        } catch (error) {
            console.error('Error fetching status:', error.message);
            response.status(500).json({ error: 'Internal Server Error' });
        }
    }

    /**
     * Returns the number of users and files in the database.
     * Response format: { "users": Number, "files": Number }
     * HTTP Status: 200
     */
    static async getStats(request, response) {
        try {
            const stats = {
                users: await dbClient.nbUsers(),
                files: await dbClient.nbFiles(),
            };
            response.status(200).json(stats);
        } catch (error) {
            console.error('Error fetching stats:', error.message);
            response.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

export default AppController;
