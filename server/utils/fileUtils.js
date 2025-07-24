const fs = require('fs').promises;
const path = require('path');

/**
 * File System Utilities
 * Helper functions for file and directory operations
 */

/**
 * Create directory if it doesn't exist
 * @param {string} dirPath - Directory path to create
 */
const createDirectoryIfNotExists = async (dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`✅ Directory ensured: ${dirPath}`);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error(`❌ Error creating directory ${dirPath}:`, error.message);
      throw error;
    }
  }
};

/**
 * Check if file exists
 * @param {string} filePath - File path to check
 * @returns {boolean} True if file exists
 */
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get file size in bytes
 * @param {string} filePath - File path
 * @returns {number} File size in bytes
 */
const getFileSize = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    throw new Error(`Failed to get file size: ${error.message}`);
  }
};

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
const formatFileSize = (bytes) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Initialize required directories for the application
 */
const initializeDirectories = async () => {
  const directories = [
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../temp'),
    path.join(__dirname, '../logs')
  ];

  for (const dir of directories) {
    await createDirectoryIfNotExists(dir);
  }
};

module.exports = {
  createDirectoryIfNotExists,
  fileExists,
  getFileSize,
  formatFileSize,
  initializeDirectories
};
