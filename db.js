var config      = require('./config/knexConfig');
var ENV = process.env.NODE_ENV == 'production'?'production':'development';
var knex        = require('knex')(config[ENV]);
//var knex = Knex.initialize(config[ENV]);
//knex.migrate.latest([config]);
module.exports = knex;
