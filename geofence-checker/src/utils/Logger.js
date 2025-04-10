/**
 * Utility class for application logging with lazy formatting
 */
class Logger {
    static INFO = 'INFO';
    static WARNING = 'WARNING';
    static ERROR = 'ERROR';
    
    /**
     * Generic log method with support for lazy formatting
     * @param {string} level - Log level
     * @param {string} message - Message to log
     * @param {...any} args - Optional arguments for lazy formatting
     */
    static log(level, message, ...args) {
        if (args && args.length > 0) {
            console.log(`[${level}] ${new Date().toISOString()}: ${message}`, ...args);
        } else {
            console.log(`[${level}] ${new Date().toISOString()}: ${message}`);
        }
    }
    
    /**
     * Log an info message
     * @param {string} message - Message to log
     * @param {...any} args - Optional arguments for lazy formatting
     */
    static info(message, ...args) {
        this.log(this.INFO, message, ...args);
    }
    
    /**
     * Log a warning message
     * @param {string} message - Message to log
     * @param {...any} args - Optional arguments for lazy formatting
     */
    static warning(message, ...args) {
        this.log(this.WARNING, message, ...args);
    }
    
    /**
     * Log an error message
     * @param {string} message - Message to log
     * @param {...any} args - Optional arguments for lazy formatting
     */
    static error(message, ...args) {
        this.log(this.ERROR, message, ...args);
    }
}

export default Logger;