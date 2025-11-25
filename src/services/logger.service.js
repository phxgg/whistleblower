import path from 'node:path';
import { fileURLToPath } from 'node:url';

import winston from 'winston';

// Logger Service

/**
 * @param {ImportMeta} importMeta
 * @returns {string} label for the logger
 */
const getLabel = (importMeta) => {
  const filename = fileURLToPath(importMeta.url);
  const parts = filename.split(path.sep);
  return path.join(parts[parts.length - 2], parts.pop());
};

/**
 * @param {ImportMeta} importMeta
 * @returns {winston.Logger}
 */
export const createLogger = (importMeta) => {
  return new winston.createLogger({
    format: winston.format.combine(
      winston.format.label({ label: getLabel(importMeta) }),
      winston.format.timestamp({
        format: 'YYYY/MM/DD hh:mm:ss',
      }),
      winston.format.printf(
        (info) =>
          `[${info.timestamp}] - "${info.label}" => [${info.level}]: "${info.message}"${info.stack ? '\n' + info.stack : ''}`
      )
      //winston.format.json(),
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.colorize({ all: true }),
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
      }),
      new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
  });
};

export default createLogger;
