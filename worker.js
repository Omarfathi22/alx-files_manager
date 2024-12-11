import Queue from 'bull';
import { ObjectId } from 'mongodb';
import { promises as fsPromises } from 'fs';
import fileUtils from './utils/file';
import userUtils from './utils/user';
import basicUtils from './utils/basic';

const imageThumbnail = require('image-thumbnail');

// Initialize Bull queues for file and user processing
const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

// Process jobs in the fileQueue
fileQueue.process(async (job) => {
    const { fileId, userId } = job.data;

    // Ensure required data is present
    if (!userId) {
        console.log('Missing userId');
        throw new Error('Missing userId');
    }

    if (!fileId) {
        console.log('Missing fileId');
        throw new Error('Missing fileId');
    }

    // Validate userId and fileId formats
    if (!basicUtils.isValidId(fileId) || !basicUtils.isValidId(userId)) {
        throw new Error('File not found');
    }

    // Retrieve the file based on fileId and userId
    const file = await fileUtils.getFile({
        _id: ObjectId(fileId),
        userId: ObjectId(userId),
    });

    if (!file) throw new Error('File not found');

    const { localPath } = file;
    const options = {};
    const widths = [500, 250, 100]; // Thumbnail widths to generate

    // Generate thumbnails for the specified widths
    widths.forEach(async (width) => {
        options.width = width;
        try {
            const thumbnail = await imageThumbnail(localPath, options);
            await fsPromises.writeFile(`${localPath}_${width}`, thumbnail);
        } catch (err) {
            console.error(`Error generating thumbnail for width ${width}: ${err.message}`);
        }
    });
});

// Process jobs in the userQueue
userQueue.process(async (job) => {
    const { userId } = job.data;

    // Ensure required data is present
    if (!userId) {
        console.log('Missing userId');
        throw new Error('Missing userId');
    }

    // Validate userId format
    if (!basicUtils.isValidId(userId)) {
        throw new Error('User not found');
    }

    // Retrieve the user based on userId
    const user = await userUtils.getUser({
        _id: ObjectId(userId),
    });

    if (!user) throw new Error('User not found');

    // Log a welcome message for the user
    console.log(`Welcome ${user.email}!`);
});
