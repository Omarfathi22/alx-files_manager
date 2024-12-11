import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

function controllerRouting(app) {
    const router = express.Router();
    app.use('/', router);

    // App Controller Routes

    // Endpoint to check the status of Redis and the database
    // Returns if Redis and DB are alive
    router.get('/status', (req, res) => {
        AppController.getStatus(req, res);
    });

    // Endpoint to get the statistics on the number of users and files in the DB
    // Returns the count of users and files
    router.get('/stats', (req, res) => {
        AppController.getStats(req, res);
    });

    // User Controller Routes

    // Endpoint to create a new user in the database
    // Accepts email and password as input, creates a user if valid
    router.post('/users', (req, res) => {
        UsersController.postNew(req, res);
    });

    // Endpoint to retrieve the currently authenticated user
    // Returns the user's email and ID based on the authentication token
    router.get('/users/me', (req, res) => {
        UsersController.getMe(req, res);
    });

    // Auth Controller Routes

    // Endpoint to sign-in the user by generating a new authentication token
    // Returns an authentication token for the user
    router.get('/connect', (req, res) => {
        AuthController.getConnect(req, res);
    });

    // Endpoint to sign-out the user based on the token
    // Invalidates the authentication token and signs out the user
    router.get('/disconnect', (req, res) => {
        AuthController.getDisconnect(req, res);
    });

    // Files Controller Routes

    // Endpoint to upload a new file
    // Saves the file in the database and on disk
    router.post('/files', (req, res) => {
        FilesController.postUpload(req, res);
    });

    // Endpoint to retrieve a file's metadata based on the ID
    // Returns the file's document from the database
    router.get('/files/:id', (req, res) => {
        FilesController.getShow(req, res);
    });

    // Endpoint to retrieve all files for a specific user, filtered by parentId and with pagination
    // Returns a list of files based on the provided query parameters (e.g., parentId, pagination)
    router.get('/files', (req, res) => {
        FilesController.getIndex(req, res);
    });

    // Endpoint to set a file's visibility to public
    // Updates the file's document to make it publicly accessible
    router.put('/files/:id/publish', (req, res) => {
        FilesController.putPublish(req, res);
    });

    // Endpoint to set a file's visibility to private
    // Updates the file's document to make it private
    router.put('/files/:id/unpublish', (req, res) => {
        FilesController.putUnpublish(req, res);
    });

    // Endpoint to retrieve the content of a file based on its ID
    // Returns the actual file content (data) stored in the database or disk
    router.get('/files/:id/data', (req, res) => {
        FilesController.getFile(req, res);
    });
}

export default controllerRouting;
