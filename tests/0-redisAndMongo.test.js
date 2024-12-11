import { expect, use, should } from 'chai';
import chaiHttp from 'chai-http';
import { promisify } from 'util';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

use(chaiHttp);
should();

describe('Testing the clients for MongoDB and Redis', () => {

    // Redis Client Tests
    describe('Redis Client', () => {
        // Clean up Redis before each test
        before(async () => {
            await redisClient.client.flushall('ASYNC');
        });

        // Clean up Redis after each test
        after(async () => {
            await redisClient.client.flushall('ASYNC');
        });

        it('should show that the Redis connection is alive', async () => {
            // Check if the Redis client connection is alive
            expect(redisClient.isAlive()).to.equal(true);
        });

        it('should return null for a non-existent key', async () => {
            // Test for a non-existent key, it should return null
            expect(await redisClient.get('myKey')).to.equal(null);
        });

        it('should set a key without issue', async () => {
            // Test setting a key in Redis without any errors
            expect(await redisClient.set('myKey', 12, 1)).to.equal(undefined);
        });

        it('should return null for a key after it expires', async () => {
            // Wait for the key to expire and check if it's removed from Redis
            const sleep = promisify(setTimeout);
            await sleep(1100); // Wait for the key to expire after 1 second
            expect(await redisClient.get('myKey')).to.equal(null);
        });
    });

    // MongoDB Client Tests
    describe('DB Client', () => {
        // Clean up the database before each test
        before(async () => {
            await dbClient.usersCollection.deleteMany({});
            await dbClient.filesCollection.deleteMany({});
        });

        // Clean up the database after each test
        after(async () => {
            await dbClient.usersCollection.deleteMany({});
            await dbClient.filesCollection.deleteMany({});
        });

        it('should show that the database connection is alive', () => {
            // Check if the MongoDB client connection is alive
            expect(dbClient.isAlive()).to.equal(true);
        });

        it('should return the correct number of user documents in the DB', async () => {
            // Start with no users, then insert two users and check the count
            await dbClient.usersCollection.deleteMany({});
            expect(await dbClient.nbUsers()).to.equal(0); // Initially, no users

            // Insert two users and check the count again
            await dbClient.usersCollection.insertOne({ name: 'Larry' });
            await dbClient.usersCollection.insertOne({ name: 'Karla' });
            expect(await dbClient.nbUsers()).to.equal(2); // Now there are 2 users
        });

        it('should return the correct number of file documents in the DB', async () => {
            // Start with no files, then insert two files and check the count
            await dbClient.filesCollection.deleteMany({});
            expect(await dbClient.nbFiles()).to.equal(0); // Initially, no files

            // Insert two files and check the count again
            await dbClient.filesCollection.insertOne({ name: 'FileOne' });
            await dbClient.filesCollection.insertOne({ name: 'FileTwo' });
            expect(await dbClient.nbFiles()).to.equal(2); // Now there are 2 files
        });
    });

});
