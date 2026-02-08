/**
 * Logger Module for Student-Teacher Booking Appointment System
 * Logs all actions performed in the application
 */

const Logger = (function() {
    'use strict';

    // Log levels
    const LOG_LEVELS = {
        DEBUG: 'DEBUG',
        INFO: 'INFO',
        WARN: 'WARN',
        ERROR: 'ERROR'
    };

    // Initialize logs array for local storage
    let logs = JSON.parse(localStorage.getItem('app_logs') || '[]');

    /**
     * Save logs to localStorage
     */
    function saveLogs() {
        // Keep only last 1000 logs to prevent storage overflow
        if (logs.length > 1000) {
            logs = logs.slice(-1000);
        }
        localStorage.setItem('app_logs', JSON.stringify(logs));
    }

    /**
     * Create a log entry
     * @param {string} level - Log level
     * @param {string} module - Module name (e.g., 'Auth', 'Admin', 'Teacher', 'Student')
     * @param {string} action - Action performed
     * @param {Object} details - Additional details
     */
    function createLog(level, module, action, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            module: module,
            action: action,
            details: details,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        logs.push(logEntry);
        saveLogs();

        // Console output with styling
        const styles = {
            [LOG_LEVELS.DEBUG]: 'color: #6c757d',
            [LOG_LEVELS.INFO]: 'color: #0066cc',
            [LOG_LEVELS.WARN]: 'color: #ff9800',
            [LOG_LEVELS.ERROR]: 'color: #f44336; font-weight: bold'
        };

        console.log(
            `%c[${logEntry.timestamp}] [${level}] [${module}] ${action}`,
            styles[level] || styles[LOG_LEVELS.INFO],
            details
        );

        return logEntry;
    }

    // Public API
    return {
        /**
         * Log debug message
         */
        debug: function(module, action, details) {
            return createLog(LOG_LEVELS.DEBUG, module, action, details);
        },

        /**
         * Log info message
         */
        info: function(module, action, details) {
            return createLog(LOG_LEVELS.INFO, module, action, details);
        },

        /**
         * Log warning message
         */
        warn: function(module, action, details) {
            return createLog(LOG_LEVELS.WARN, module, action, details);
        },

        /**
         * Log error message
         */
        error: function(module, action, details) {
            return createLog(LOG_LEVELS.ERROR, module, action, details);
        },

        /**
         * Get all logs
         */
        getLogs: function() {
            return [...logs];
        },

        /**
         * Get logs by module
         */
        getLogsByModule: function(module) {
            return logs.filter(log => log.module === module);
        },

        /**
         * Get logs by level
         */
        getLogsByLevel: function(level) {
            return logs.filter(log => log.level === level);
        },

        /**
         * Clear all logs
         */
        clearLogs: function() {
            logs = [];
            saveLogs();
            this.info('Logger', 'Logs cleared', {});
        },

        /**
         * Export logs as JSON
         */
        exportLogs: function() {
            const dataStr = JSON.stringify(logs, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `app_logs_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.info('Logger', 'Logs exported', { count: logs.length });
        },

        /**
         * Log user authentication action
         */
        logAuth: function(action, userId, success, details = {}) {
            return this.info('Auth', action, {
                userId: userId,
                success: success,
                ...details
            });
        },

        /**
         * Log admin action
         */
        logAdmin: function(action, adminId, details = {}) {
            return this.info('Admin', action, {
                adminId: adminId,
                ...details
            });
        },

        /**
         * Log teacher action
         */
        logTeacher: function(action, teacherId, details = {}) {
            return this.info('Teacher', action, {
                teacherId: teacherId,
                ...details
            });
        },

        /**
         * Log student action
         */
        logStudent: function(action, studentId, details = {}) {
            return this.info('Student', action, {
                studentId: studentId,
                ...details
            });
        },

        /**
         * Log database operation
         */
        logDatabase: function(operation, collection, details = {}) {
            return this.debug('Database', operation, {
                collection: collection,
                ...details
            });
        },

        /**
         * Log API call
         */
        logAPI: function(method, endpoint, status, details = {}) {
            return this.debug('API', `${method} ${endpoint}`, {
                status: status,
                ...details
            });
        }
    };
})();

// Make Logger available globally
window.Logger = Logger;

// Log system initialization
document.addEventListener('DOMContentLoaded', function() {
    Logger.info('System', 'Application initialized', {
        url: window.location.href,
        timestamp: new Date().toISOString()
    });
});
