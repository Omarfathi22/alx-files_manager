import { ObjectId } from 'mongodb';

/**
 * Module providing basic utility functions.
 */
const basicUtils = {
    /**
     * Validates whether the provided ID is a valid MongoDB ObjectId.
     * @param {string|number} id - The ID to be validated.
     * @returns {boolean} - Returns true if the ID is valid, false if not.
     * 
     * The function attempts to convert the provided ID into an ObjectId using MongoDB's ObjectId constructor.
     * If the conversion is successful, the ID is valid. If an error occurs during conversion, the ID is invalid.
     */
    isValidId(id) {
        try {
            ObjectId(id); // Tries to convert the id to a MongoDB ObjectId.
        } catch (err) {
            return false; // If conversion fails, return false.
        }
        return true; // If conversion succeeds, return true.
    },
};

export default basicUtils;
