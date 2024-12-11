import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

/**
 * Class for performing operations with MongoDB service.
 */
class DBClient {
    constructor() {
        // Connects to MongoDB using the provided URL and database details.
        MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
            if (!err) {
                // If connection is successful, set up the database and collections
                this.db = client.db(DB_DATABASE);
                this.usersCollection = this.db.collection('users');
                this.filesCollection = this.db.collection('files');
            } else {
                // If connection fails, log the error and set db to false
                console.log(err.message);
                this.db = false;
            }
        });
    }

    /**
     * Checks if the connection to MongoDB is alive.
     * @returns {boolean} - Returns true if the connection is alive, false otherwise.
     * 
     * This method checks if the `db` property is truthy, indicating a successful connection.
     */
    isAlive() {
        return Boolean(this.db);
    }

    /**
     * Returns the number of documents in the 'users' collection.
     * @returns {number} - The number of users in the 'users' collection.
     * 
     * This method counts the number of documents in the `usersCollection`.
     */
    async nbUsers() {
        const numberOfUsers = await this.usersCollection.countDocuments();
        return numberOfUsers;
    }

    /**
     * Returns the number of documents in the 'files' collection.
     * @returns {number} - The number of files in the 'files' collection.
     * 
     * This method counts the number of documents in the `filesCollection`.
     */
    async nbFiles() {
        const numberOfFiles = await this.filesCollection.countDocuments();
        return numberOfFiles;
    }
}

// Instantiate the DBClient class to establish a connection.
const dbClient = new DBClient();

export default dbClient;
