/**
 * Logger Utility
 * Simple logging utility for the application
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Get formatted timestamp
 * @returns {string} Formatted timestamp
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Log info message
 * @param {string} message - Message to log
 * @param {any} data - Additional data to log
 */
const info = (message, data = null) => {
  console.log(`${colors.blue}ℹ️  [INFO]${colors.reset} ${getTimestamp()} - ${message}`);
  if (data) console.log(data);
};

/**
 * Log success message
 * @param {string} message - Message to log
 * @param {any} data - Additional data to log
 */
const success = (message, data = null) => {
  console.log(`${colors.green}✅ [SUCCESS]${colors.reset} ${getTimestamp()} - ${message}`);
  if (data) console.log(data);
};

/**
 * Log warning message
 * @param {string} message - Message to log
 * @param {any} data - Additional data to log
 */
const warn = (message, data = null) => {
  console.log(`${colors.yellow}⚠️  [WARN]${colors.reset} ${getTimestamp()} - ${message}`);
  if (data) console.log(data);
};

/**
 * Log error message
 * @param {string} message - Message to log
 * @param {any} error - Error object or additional data
 */
const error = (message, error = null) => {
  console.log(`${colors.red}❌ [ERROR]${colors.reset} ${getTimestamp()} - ${message}`);
  if (error) {
    if (error.stack) {
      console.log(error.stack);
    } else {
      console.log(error);
    }
  }
};

/**
 * Log debug message (only in development)
 * @param {string} message - Message to log
 * @param {any} data - Additional data to log
 */
const debug = (message, data = null) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${colors.magenta}🐛 [DEBUG]${colors.reset} ${getTimestamp()} - ${message}`);
    if (data) console.log(data);
  }
};

/**
 * Log server startup message
 * @param {number} port - Server port
 */
const serverStart = (port) => {
  console.log(`\n${colors.cyan}🚀 PDF Dost Server Started${colors.reset}`);
  console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`📄 Server running on port: ${colors.yellow}${port}${colors.reset}`);
  console.log(`🌐 API available at: ${colors.cyan}http://localhost:${port}/api${colors.reset}`);
  console.log(`🔍 Health check: ${colors.cyan}http://localhost:${port}/api/health${colors.reset}`);
  console.log(`⏰ Started at: ${colors.green}${getTimestamp()}${colors.reset}`);
  console.log(`${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
};

module.exports = {
  info,
  success,
  warn,
  error,
  debug,
  serverStart
};
