import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import dbClient from './db';
import userUtils from './user';
import basicUtils from './basic';

/**
 * Module with file utilities to manage files in MongoDB and on disk
 */
const fileUtils = {
    /**
     * Validates if the request body is valid for creating a file
     * @request {request_object} - Express request object
     * @return {object} - Object containing validation error message and validated parameters
     */
    async validateBody(request) {
        const {
            name, type, isPublic = false, data,
        } = request.body;

        let { parentId = 0 } = request.body;

        const typesAllowed = ['file', 'image', 'folder'];
        let msg = null;

        if (parentId === '0') parentId = 0;

        // Check for missing parameters and invalid file type
        if (!name) {
            msg = 'Missing name';
        } else if (!type || !typesAllowed.includes(type)) {
            msg = 'Missing or invalid type';
        } else if (!data && type !== 'folder') {
            msg = 'Missing data';
        } else if (parentId && parentId !== '0') {
            let file;

            if (basicUtils.isValidId(parentId)) {
                file = await this.getFile({
                    _id: ObjectId(parentId),
                });
            } else {
                file = null;
            }

            // Check if parent file exists and is a folder
            if (!file) {
                msg = 'Parent not found';
            } else if (file.type !== 'folder') {
                msg = 'Parent is not a folder';
            }
        }

        const obj = {
            error: msg,
            fileParams: {
                name,
                type,
                parentId,
                isPublic,
                data,
            },
        };

        return obj;
    },

    /**
     * Retrieves a file document from the database based on the provided query
     * @query {obj} - Query used to find the file
     * @return {object} - The file document if found
     */
    async getFile(query) {
        const file = await dbClient.filesCollection.findOne(query);
        return file;
    },

    /**
     * Retrieves a list of file documents belonging to a specific parentId
     * @query {obj} - Query used to find files
     * @return {Array} - List of file documents
     */
    async getFilesOfParentId(query) {
        const fileList = await dbClient.filesCollection.aggregate(query);
        return fileList;
    },

    /**
     * Saves a file to the database and disk
     * @userId {string} - The ID of the user uploading the file
     * @fileParams {object} - Object containing file parameters (name, type, etc.)
     * @FOLDER_PATH {string} - The path to save the file on disk
     * @return {object} - Object containing error message (if any) and the saved file
     */
    async saveFile(userId, fileParams, FOLDER_PATH) {
        const {
            name, type, isPublic, data,
        } = fileParams;
        let { parentId } = fileParams;

        // Convert parentId to ObjectId if necessary
        if (parentId !== 0) parentId = ObjectId(parentId);

        const query = {
            userId: ObjectId(userId),
            name,
            type,
            isPublic,
            parentId,
        };

        // Handle non-folder file types
        if (fileParams.type !== 'folder') {
            const fileNameUUID = uuidv4();
            const fileDataDecoded = Buffer.from(data, 'base64');
            const path = `${FOLDER_PATH}/${fileNameUUID}`;

            query.localPath = path;

            try {
                // Ensure the folder exists and write the file to disk
                await fsPromises.mkdir(FOLDER_PATH, { recursive: true });
                await fsPromises.writeFile(path, fileDataDecoded);
            } catch (err) {
                return { error: err.message, code: 400 };
            }
        }

        // Insert the file record into the database
        const result = await dbClient.filesCollection.insertOne(query);

        // Process the file document before returning
        const file = this.processFile(query);
        const newFile = { id: result.insertedId, ...file };

        return { error: null, newFile };
    },

    /**
     * Updates an existing file document in the database
     * @query {obj} - Query to find the file document
     * @set {obj} - Updates to be applied to the file document
     * @return {object} - The updated file document
     */
    async updateFile(query, set) {
        const fileList = await dbClient.filesCollection.findOneAndUpdate(
            query,
            set,
            { returnOriginal: false },
        );
        return fileList;
    },

    /**
     * Toggles the file's public status (public or private)
     * @request {request_object} - Express request object
     * @setPublish {boolean} - Whether to make the file public (true) or private (false)
     * @return {object} - Error message (if any), status code, and updated file
     */
    async publishUnpublish(request, setPublish) {
        const { id: fileId } = request.params;

        if (!basicUtils.isValidId(fileId)) { return { error: 'Unauthorized', code: 401 }; }

        const { userId } = await userUtils.getUserIdAndKey(request);

        if (!basicUtils.isValidId(userId)) { return { error: 'Unauthorized', code: 401 }; }

        const user = await userUtils.getUser({
            _id: ObjectId(userId),
        });

        if (!user) return { error: 'Unauthorized', code: 401 };

        const file = await this.getFile({
            _id: ObjectId(fileId),
            userId: ObjectId(userId),
        });

        if (!file) return { error: 'Not found', code: 404 };

        // Update the file's public status in the database
        const result = await this.updateFile(
            {
                _id: ObjectId(fileId),
                userId: ObjectId(userId),
            },
            { $set: { isPublic: setPublish } },
        );

        const {
            _id: id,
            userId: resultUserId,
            name,
            type,
            isPublic,
            parentId,
        } = result.value;

        const updatedFile = {
            id,
            userId: resultUserId,
            name,
            type,
            isPublic,
            parentId,
        };

        return { error: null, code: 200, updatedFile };
    },

    /**
     * Transforms the file document by replacing _id with id and removing localPath
     * @doc {object} - The document to be processed
     * @return {object} - The processed document with id and without localPath
     */
    processFile(doc) {
        const file = { id: doc._id, ...doc };
        delete file.localPath;
        delete file._id;
        return file;
    },

    /**
     * Checks if a file is public and belongs to a specific user
     * @file {object} - The file document to check
     * @userId {string} - The user ID to check ownership
     * @return {boolean} - Returns true if the file is public or owned by the user
     */
    isOwnerAndPublic(file, userId) {
        if (
            (!file.isPublic && !userId)
            || (userId && file.userId.toString() !== userId && !file.isPublic)
        ) { return false; }

        return true;
    },

    /**
     * Retrieves the file's data from the database and disk
     * @file {object} - The file document to obtain data for
     * @size {string} - Optional size parameter for image files
     * @return {object} - The file's data or an error message if not found
     */
    async getFileData(file, size) {
        let { localPath } = file;
        let data;

        // Adjust the local path if size is provided (for images)
        if (size) localPath = `${localPath}_${size}`;

        try {
            data = await fsPromises.readFile(localPath);
        } catch (err) {
            return { error: 'Not found', code: 404 };
        }

        return { data };
    },
};

export default fileUtils;
