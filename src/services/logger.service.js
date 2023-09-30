const winston = require('winston');
const path = require('node:path');

// Logger Service

/**
 * @param {NodeModule} callingModule
 * @returns {string} label for the logger
 */
const getLabel = (callingModule) => {
  const parts = callingModule.filename.split(path.sep);
  return path.join(parts[parts.length - 2], parts.pop());
};

/**
 * @param {NodeModule} callingModule
 * @returns {winston.Logger}
 */
module.exports = (callingModule) => {
  return new winston.createLogger({
    format: winston.format.combine(
      winston.format.label({ label: getLabel(callingModule) }),
      winston.format.timestamp({
        format: "YYYY/MM/DD hh:mm:ss"
      }),
      winston.format.printf(
        info => `[${info.timestamp}] - "${info.label}" => [${info.level}]: "${info.message}"${info.stack ? '\n' + info.stack : ''}`
      ),
      //winston.format.json(),
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.colorize({ all: true }),
      }),
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' }),
    ]
  });
};
