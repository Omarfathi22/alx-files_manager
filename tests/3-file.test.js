import {
    expect, use, should, request,
} from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import { ObjectId } from 'mongodb';
import app from '../server';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

use(chaiHttp);
should();

// User Endpoints ==============================================

describe('testing User Endpoints', () => {
    const credentials = 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE='; // Basic authorization credentials for the test
    let token = ''; // Stores the token after successful login
    let userId = ''; // Stores the user ID after user creation
    const user = {
        email: 'bob@dylan.com',
        password: 'toto1234!', // User credentials for registration and login
    };

    // Runs before any tests to clean up the database and Redis
    before(async () => {
        await redisClient.client.flushall('ASYNC'); // Clears Redis
        await dbClient.usersCollection.deleteMany({}); // Clears users collection in the database
        await dbClient.filesCollection.deleteMany({}); // Clears files collection in the database
    });

    // Runs after all tests to clean up the database and Redis
    after(async () => {
        await redisClient.client.flushall('ASYNC'); // Clears Redis
        await dbClient.usersCollection.deleteMany({}); // Clears users collection in the database
        await dbClient.filesCollection.deleteMany({}); // Clears files collection in the database
    });

    // User Registration Endpoint
    describe('pOST /users', () => {
        it('returns the id and email of created user', async () => {
            // Test: Successfully create a new user
            const response = await request(app).post('/users').send(user);
            const body = JSON.parse(response.text);
            expect(body.email).to.equal(user.email); // Ensure the email is correct
            expect(body).to.have.property('id'); // Ensure the user ID is returned
            expect(response.statusCode).to.equal(201); // Expect status code 201 (Created)

            userId = body.id; // Store the user ID for later tests
            const userMongo = await dbClient.usersCollection.findOne({
                _id: ObjectId(body.id),
            });
            expect(userMongo).to.exist; // Ensure the user is stored in the database
        });

        it('fails to create user because password is missing', async () => {
            // Test: Fail to create a user because password is missing
            const user = {
                email: 'bob@dylan.com',
            };
            const response = await request(app).post('/users').send(user);
            const body = JSON.parse(response.text);
            expect(body).to.eql({ error: 'Missing password' }); // Expect error message for missing password
            expect(response.statusCode).to.equal(400); // Expect status code 400 (Bad Request)
        });

        it('fails to create user because email is missing', async () => {
            // Test: Fail to create a user because email is missing
            const user = {
                password: 'toto1234!',
            };
            const response = await request(app).post('/users').send(user);
            const body = JSON.parse(response.text);
            expect(body).to.eql({ error: 'Missing email' }); // Expect error message for missing email
            expect(response.statusCode).to.equal(400); // Expect status code 400 (Bad Request)
        });

        it('fails to create user because it already exists', async () => {
            // Test: Fail to create a user because the email already exists
            const user = {
                email: 'bob@dylan.com',
                password: 'toto1234!',
            };
            const response = await request(app).post('/users').send(user);
            const body = JSON.parse(response.text);
            expect(body).to.eql({ error: 'Already exist' }); // Expect error message for user already existing
            expect(response.statusCode).to.equal(400); // Expect status code 400 (Bad Request)
        });
    });

    // Connect Endpoint (Login)
    describe('gET /connect', () => {
        it('fails if no user is found for credentials', async () => {
            // Test: Fail to login if invalid credentials
            const response = await request(app).get('/connect').send();
            const body = JSON.parse(response.text);
            expect(body).to.eql({ error: 'Unauthorized' }); // Expect error message for unauthorized access
            expect(response.statusCode).to.equal(401); // Expect status code 401 (Unauthorized)
        });

        it('returns a token if user is found for credentials', async () => {
            // Test: Successfully login and receive a token
            const spyRedisSet = sinon.spy(redisClient, 'set'); // Spy on Redis set method to verify token storage

            const response = await request(app)
                .get('/connect')
                .set('Authorization', credentials)
                .send();
            const body = JSON.parse(response.text);
            token = body.token; // Store the token for future use
            expect(body).to.have.property('token'); // Ensure token is returned
            expect(response.statusCode).to.equal(200); // Expect status code 200 (OK)
            expect(
                spyRedisSet.calledOnceWithExactly(`auth_${token}`, userId, 24 * 3600),
            ).to.be.true; // Verify the token is stored in Redis for 24 hours

            spyRedisSet.restore(); // Restore the original Redis set method
        });

        it('token exists in redis', async () => {
            // Test: Check if the token is stored in Redis
            const redisToken = await redisClient.get(`auth_${token}`);
            expect(redisToken).to.exist; // Expect the token to exist in Redis
        });
    });

    // Disconnect Endpoint (Logout)
    describe('gET /disconnect', () => {
        after(async () => {
            // Cleanup Redis after tests
            await redisClient.client.flushall('ASYNC');
        });

        it('should respond with unauthorized because there is no token for user', async () => {
            // Test: Fail to logout if no token is provided
            const response = await request(app).get('/disconnect').send();
            const body = JSON.parse(response.text);
            expect(body).to.eql({ error: 'Unauthorized' }); // Expect error message for unauthorized access
            expect(response.statusCode).to.equal(401); // Expect status code 401 (Unauthorized)
        });

        it('should sign-out the user based on the token', async () => {
            // Test: Successfully logout the user based on the token
            const response = await request(app)
                .get('/disconnect')
                .set('X-Token', token)
                .send();
            expect(response.text).to.be.equal(''); // Expect no response body
            expect(response.statusCode).to.equal(204); // Expect status code 204 (No Content)
        });

        it('token no longer exists in redis', async () => {
            // Test: Ensure the token is deleted from Redis after logout
            const redisToken = await redisClient.get(`auth_${token}`);
            expect(redisToken).to.not.exist; // Ensure the token is no longer present in Redis
        });
    });

    // User Profile Endpoint
    describe('gET /users/me', () => {
        before(async () => {
            // Get a valid token before testing the profile route
            const response = await request(app)
                .get('/connect')
                .set('Authorization', credentials)
                .send();
            const body = JSON.parse(response.text);
            token = body.token;
        });

        it('should return unauthorized because no token is passed', async () => {
            // Test: Fail to retrieve user profile if no token is provided
            const response = await request(app).get('/users/me').send();
            const body = JSON.parse(response.text);
            expect(body).to.be.eql({ error: 'Unauthorized' }); // Expect error message for unauthorized access
            expect(response.statusCode).to.equal(401); // Expect status code 401 (Unauthorized)
        });

        it('should retrieve the user based on the token used', async () => {
            // Test: Successfully retrieve the user profile based on the provided token
            const response = await request(app)
                .get('/users/me')
                .set('X-Token', token)
                .send();
            const body = JSON.parse(response.text);
            expect(body).to.be.eql({ id: userId, email: user.email }); // Expect user details to match
            expect(response.statusCode).to.equal(200); // Expect status code 200 (OK)
        });
    });
});
