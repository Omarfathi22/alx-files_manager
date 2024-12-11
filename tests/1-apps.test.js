import {
    expect, use, should, request,
} from 'chai';
import chaiHttp from 'chai-http';
import app from '../server';
import dbClient from '../utils/db';

use(chaiHttp);
should();

describe('Testing App Status Endpoints', () => {

    // Test the /status endpoint
    describe('GET /status', () => {
        it('should return the status of Redis and MongoDB connections', async () => {
            // Make a GET request to the /status endpoint
            const response = await request(app).get('/status').send();
            const body = JSON.parse(response.text);

            // Check that the Redis and MongoDB connections are both alive
            expect(body).to.eql({ redis: true, db: true });
            expect(response.statusCode).to.equal(200); // Ensure the status code is 200
        });
    });

    // Test the /stats endpoint
    describe('GET /stats', () => {
        // Before tests, clear the users and files collections in the database
        before(async () => {
            await dbClient.usersCollection.deleteMany({});
            await dbClient.filesCollection.deleteMany({});
        });

        it('should return 0 users and files when the database is empty', async () => {
            // Make a GET request to the /stats endpoint
            const response = await request(app).get('/stats').send();
            const body = JSON.parse(response.text);

            // Check that the response correctly returns 0 users and 0 files
            expect(body).to.eql({ users: 0, files: 0 });
            expect(response.statusCode).to.equal(200); // Ensure the status code is 200
        });

        it('should return the correct number of users and files in the database', async () => {
            // Insert a user and two files into the database
            await dbClient.usersCollection.insertOne({ name: 'Larry' });
            await dbClient.filesCollection.insertOne({ name: 'image.png' });
            await dbClient.filesCollection.insertOne({ name: 'file.txt' });

            // Make a GET request to the /stats endpoint
            const response = await request(app).get('/stats').send();
            const body = JSON.parse(response.text);

            // Check that the response returns 1 user and 2 files
            expect(body).to.eql({ users: 1, files: 2 });
            expect(response.statusCode).to.equal(200); // Ensure the status code is 200
        });
    });
});
