import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import userUtils from '../utils/user';

class AuthController {
    /**
     * Handles user login by generating a new authentication token.
     * Response: { "token": "<generated-token>" }, Status: 200
     * Error: { "error": "Unauthorized" }, Status: 401
     */
    static async getConnect(request, response) {
        try {
            const Authorization = request.header('Authorization') || '';
            if (!Authorization.startsWith('Basic ')) {
                return response.status(401).json({ error: 'Unauthorized' });
            }

            const credentials = Authorization.split(' ')[1];
            if (!credentials) {
                return response.status(401).json({ error: 'Unauthorized' });
            }

            const decodedCredentials = Buffer.from(credentials, 'base64').toString('utf-8');
            const [email, password] = decodedCredentials.split(':');

            if (!email || !password) {
                return response.status(401).json({ error: 'Unauthorized' });
            }

            const sha1Password = sha1(password);
            const user = await userUtils.getUser({ email, password: sha1Password });

            if (!user) {
                return response.status(401).json({ error: 'Unauthorized' });
            }

            const token = uuidv4();
            const key = `auth_${token}`;
            const hoursForExpiration = 24;

            await redisClient.set(key, user._id.toString(), hoursForExpiration * 3600);

            return response.status(200).json({ token });
        } catch (error) {
            console.error('Error in getConnect:', error.message);
            return response.status(500).json({ error: 'Internal Server Error' });
        }
    }

    /**
     * Handles user logout by invalidating the authentication token.
     * Response: Empty, Status: 204
     * Error: { "error": "Unauthorized" }, Status: 401
     */
    static async getDisconnect(request, response) {
        try {
            const { userId, key } = await userUtils.getUserIdAndKey(request);

            if (!userId) {
                return response.status(401).json({ error: 'Unauthorized' });
            }

            await redisClient.del(key);

            return response.status(204).send();
        } catch (error) {
            console.error('Error in getDisconnect:', error.message);
            return response.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

export default AuthController;
