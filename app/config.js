let config = {};
config.influx = {}
config.mongo = {}

config.influx.host = '109.108.92.138';

config.mongo.user = 'root';
config.mongo.password = 'mon_sec_pass';
config.mongo.host = '109.108.92.138';
config.mongo.db = 'admin';
config.mongo.port = '27017';

config.secret = 'super monitoring';
config.port = 8082;

module.exports = config;