import express from 'express'; // Import the Express framework
import controllerRouting from './routes/index'; // Import route handlers from a central routing file

// Create an instance of the Express app
const app = express();

// Define the port to listen on, with a default of 5000 if PORT is not set in the environment
const port = process.env.PORT || 5000;

// Middleware to parse incoming JSON requests
app.use(express.json());

// Set up routing using the imported controllerRouting function
controllerRouting(app);

// Start the server and listen on the specified port
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Export the app instance (useful for testing or external modules)
export default app;
