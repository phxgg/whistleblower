const { MongoClient } = require('mongodb');
const { mongodb_uri } = require('../config.json');

const db = new MongoClient(mongodb_uri);

module.exports = db;
