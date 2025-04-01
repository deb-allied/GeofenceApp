/**
 * Logger utility for client-side logging
 */
class Logger {
    /**
     * Log levels
     * @type {Object}
     */
    static LEVELS = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
    };
  
    /**
     * Current log level
     * @type {number}
     */
    static currentLevel = process.env.NODE_ENV === 'production' 
      ? Logger.LEVELS.WARN 
      : Logger.LEVELS.DEBUG;
  
    /**
     * Set the current log level
     * @param {number} level - Log level to set
     */
    static setLevel(level) {
      if (Object.values(Logger.LEVELS).includes(level)) {
        Logger.currentLevel = level;
      }
    }
  
    /**
     * Format log arguments with string interpolation
     * Supports format: '{0}, {1}' with args: ['hello', 'world'] => 'hello, world'
     * 
     * @param {string} message - Message with placeholders
     * @param  {...any} args - Arguments to interpolate
     * @returns {string} Formatted message
     */
    static formatMessage(message, ...args) {
      if (!args || !args.length) return message;
      
      return message.replace(/{(\d+)}/g, (match, index) => {
        const argIndex = Number(index);
        return typeof args[argIndex] !== 'undefined' ? args[argIndex] : match;
      });
    }
  
    /**
     * Debug level logging
     * @param {string} message - Message to log
     * @param  {...any} args - Arguments to format into message
     */
    static debug(message, ...args) {
      if (Logger.currentLevel <= Logger.LEVELS.DEBUG) {
        console.debug(`[DEBUG] ${Logger.formatMessage(message, ...args)}`);
      }
    }
  
    /**
     * Info level logging
     * @param {string} message - Message to log
     * @param  {...any} args - Arguments to format into message
     */
    static info(message, ...args) {
      if (Logger.currentLevel <= Logger.LEVELS.INFO) {
        console.info(`[INFO] ${Logger.formatMessage(message, ...args)}`);
      }
    }
  
    /**
     * Warning level logging
     * @param {string} message - Message to log
     * @param  {...any} args - Arguments to format into message
     */
    static warn(message, ...args) {
      if (Logger.currentLevel <= Logger.LEVELS.WARN) {
        console.warn(`[WARN] ${Logger.formatMessage(message, ...args)}`);
      }
    }
  
    /**
     * Error level logging
     * @param {string} message - Message to log
     * @param  {...any} args - Arguments to format into message
     */
    static error(message, ...args) {
      if (Logger.currentLevel <= Logger.LEVELS.ERROR) {
        console.error(`[ERROR] ${Logger.formatMessage(message, ...args)}`);
      }
    }
  
    /**
     * Log an API request
     * @param {string} method - HTTP method
     * @param {string} url - Request URL
     * @param {Object} data - Request data
     */
    static logApiRequest(method, url, data) {
      Logger.debug(`API Request: ${method} ${url}`);
      if (data) {
        Logger.debug('Request data: {0}', JSON.stringify(data));
      }
    }
  
    /**
     * Log an API response
     * @param {string} method - HTTP method
     * @param {string} url - Request URL
     * @param {Object} response - Response data
     */
    static logApiResponse(method, url, response) {
      Logger.debug(`API Response: ${method} ${url}`);
      if (response) {
        Logger.debug('Response data: {0}', JSON.stringify(response));
      }
    }
  
    /**
     * Log an API error
     * @param {string} method - HTTP method
     * @param {string} url - Request URL
     * @param {Error} error - Error object
     */
    static logApiError(method, url, error) {
      Logger.error(`API Error: ${method} ${url}`);
      if (error.response) {
        Logger.error('Response status: {0}', error.response.status);
        Logger.error('Response data: {0}', JSON.stringify(error.response.data));
      } else if (error.request) {
        Logger.error('No response received');
      } else {
        Logger.error('Error message: {0}', error.message);
      }
    }
  }
  
  export default Logger;