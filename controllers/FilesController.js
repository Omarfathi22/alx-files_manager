import { ObjectId } from 'mongodb';
import mime from 'mime-types';
import Queue from 'bull';
import userUtils from '../utils/user';
import fileUtils from '../utils/file';
import basicUtils from '../utils/basic';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const fileQueue = new Queue('fileQueue');

class FilesController {
    /**
     * Create a new file or folder in the database and disk.
     * 
     * Steps:
     * 1. Authenticate the user using a token. If invalid, return 401 Unauthorized.
     * 2. Validate request body (name, type, parentId, isPublic, and data for files).
     * 3. Check `parentId`:
     *    - If set, ensure it exists and is a folder; otherwise, return 400.
     * 4. For folders:
     *    - Save the document in the database and return it with status 201.
     * 5. For files or images:
     *    - Store file content locally under the path `FOLDER_PATH`.
     *    - Save the document in the database with its details.
     *    - If type is 'image', enqueue it for further processing.
     */
    static async postUpload(request, response) {
        const { userId } = await userUtils.getUserIdAndKey(request);

        if (!basicUtils.isValidId(userId)) {
            return response.status(401).send({ error: 'Unauthorized' });
        }
        if (!userId && request.body.type === 'image') {
            await fileQueue.add({});
        }

        const user = await userUtils.getUser({ _id: ObjectId(userId) });
        if (!user) return response.status(401).send({ error: 'Unauthorized' });

        const { error: validationError, fileParams } = await fileUtils.validateBody(request);
        if (validationError) return response.status(400).send({ error: validationError });

        if (fileParams.parentId !== 0 && !basicUtils.isValidId(fileParams.parentId)) {
            return response.status(400).send({ error: 'Parent not found' });
        }

        const { error, code, newFile } = await fileUtils.saveFile(userId, fileParams, FOLDER_PATH);

        if (error) {
            if (response.body.type === 'image') await fileQueue.add({ userId });
            return response.status(code).send(error);
        }

        if (fileParams.type === 'image') {
            await fileQueue.add({ fileId: newFile.id.toString(), userId: newFile.userId.toString() });
        }

        return response.status(201).send(newFile);
    }

    /**
     * Retrieve a file document by its ID.
     * 
     * Steps:
     * 1. Authenticate the user using a token. If invalid, return 401 Unauthorized.
     * 2. Validate the file ID and ensure it belongs to the user.
     * 3. If not found, return 404 Not Found.
     * 4. If found, return the file document with status 200.
     */
    static async getShow(request, response) {
        const fileId = request.params.id;
        const { userId } = await userUtils.getUserIdAndKey(request);

        const user = await userUtils.getUser({ _id: ObjectId(userId) });
        if (!user) return response.status(401).send({ error: 'Unauthorized' });

        if (!basicUtils.isValidId(fileId) || !basicUtils.isValidId(userId)) {
            return response.status(404).send({ error: 'Not found' });
        }

        const result = await fileUtils.getFile({ _id: ObjectId(fileId), userId: ObjectId(userId) });
        if (!result) return response.status(404).send({ error: 'Not found' });

        const file = fileUtils.processFile(result);
        return response.status(200).send(file);
    }

    /**
     * Retrieve all files for a specific parent ID with pagination.
     * 
     * Steps:
     * 1. Authenticate the user using a token. If invalid, return 401 Unauthorized.
     * 2. Validate and process query parameters (parentId and page).
     * 3. If parentId exists, ensure it is valid and of type folder; otherwise, return an empty list.
     * 4. Fetch and return up to 20 files per page with status 200.
     */
    static async getIndex(request, response) {
        const { userId } = await userUtils.getUserIdAndKey(request);

        const user = await userUtils.getUser({ _id: ObjectId(userId) });
        if (!user) return response.status(401).send({ error: 'Unauthorized' });

        let parentId = request.query.parentId || '0';
        if (parentId === '0') parentId = 0;

        let page = Number(request.query.page) || 0;
        if (Number.isNaN(page)) page = 0;

        if (parentId !== 0 && parentId !== '0') {
            if (!basicUtils.isValidId(parentId)) return response.status(401).send({ error: 'Unauthorized' });

            parentId = ObjectId(parentId);
            const folder = await fileUtils.getFile({ _id: ObjectId(parentId) });

            if (!folder || folder.type !== 'folder') return response.status(200).send([]);
        }

        const pipeline = [{ $match: { parentId } }, { $skip: page * 20 }, { $limit: 20 }];
        const fileCursor = await fileUtils.getFilesOfParentId(pipeline);

        const fileList = [];
        await fileCursor.forEach((doc) => fileList.push(fileUtils.processFile(doc)));

        return response.status(200).send(fileList);
    }

    /**
     * Update a file's `isPublic` field to true.
     */
    static async putPublish(request, response) {
        const { error, code, updatedFile } = await fileUtils.publishUnpublish(request, true);
        if (error) return response.status(code).send({ error });
        return response.status(code).send(updatedFile);
    }

    /**
     * Update a file's `isPublic` field to false.
     */
    static async putUnpublish(request, response) {
        const { error, code, updatedFile } = await fileUtils.publishUnpublish(request, false);
        if (error) return response.status(code).send({ error });
        return response.status(code).send(updatedFile);
    }

    /**
     * Return the content of a file based on its ID.
     * 
     * Steps:
     * 1. Validate the file ID and ensure it is accessible to the user.
     * 2. If the file is a folder, return 400 with an appropriate error message.
     * 3. Fetch file data and return it with the correct MIME type and status 200.
     */
    static async getFile(request, response) {
        const { userId } = await userUtils.getUserIdAndKey(request);
        const { id: fileId } = request.params;
        const size = request.query.size || 0;

        if (!basicUtils.isValidId(fileId)) return response.status(404).send({ error: 'Not found' });

        const file = await fileUtils.getFile({ _id: ObjectId(fileId) });
        if (!file || !fileUtils.isOwnerAndPublic(file, userId)) return response.status(404).send({ error: 'Not found' });

        if (file.type === 'folder') return response.status(400).send({ error: "A folder doesn't have content" });

        const { error, code, data } = await fileUtils.getFileData(file, size);
        if (error) return response.status(code).send({ error });

        const mimeType = mime.contentType(file.name);
        response.setHeader('Content-Type', mimeType);

        return response.status(200).send(data);
    }
}

export default FilesController;
