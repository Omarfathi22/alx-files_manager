import redisClient from './utils/redis'; // Import the Redis client

// Self-executing async function to test Redis functionality
(async () => {
    // Check if the Redis server is connected and alive
    console.log(redisClient.isAlive()); // true if connected, false otherwise

    // Attempt to retrieve a value for a non-existing key
    console.log(await redisClient.get('myKey')); // Expected output: null

    // Set a key 'myKey' with value 12 and an expiration time of 5 seconds
    await redisClient.set('myKey', 12, 5);
    console.log(await redisClient.get('myKey')); // Expected output: 12

    // Wait 10 seconds and then check if the key still exists (it should have expired)
    setTimeout(async () => {
        console.log(await redisClient.get('myKey')); // Expected output: null (key expired)
    }, 1000 * 10); // Wait for 10 seconds
})();
