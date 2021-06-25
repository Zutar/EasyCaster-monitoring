const express = require('express');
const ejs = require('ejs');
const Influx = require('influx');
const mongoose = require('mongoose');
const path = require('path');
const config = require('./config');
const session = require('express-session');


const app = express();

app.use(session({
  secret: config.secret, 
  cookie: { maxAge: 3600 * 1000 },
  resave: false,
  saveUninitialized: false
}));

app.use('/static', express.static(path.join(__dirname, '/static')));
app.set('view engine', ejs);

const influx = new Influx.InfluxDB({
    host: config.influx.host,
    database: 'monitoring',
    schema: [
      {
        measurement: 'stream_data',
        fields: {
          bitrate: Influx.FieldType.FLOAT,
          fps: Influx.FieldType.INTEGER,
          uptime: Influx.FieldType.STRING
        }, 
        tags: [
          'server', 'channel', 'stream'
        ]
      }
    ]
  })

mongoose.connect(`mongodb://${config.mongo.user}:${config.mongo.password}@${config.mongo.host}:${config.mongo.port}/${config.mongo.db}`, { useFindAndModify: false, useUnifiedTopology: true, useNewUrlParser: true }).then(() => {
  influx.getDatabaseNames()
  .then(names => {
    if (!names.includes('monitoring')) {
      return influx.createDatabase('monitoring');
    }
  })
  .then(() => {
    const index = require('./routes/index')(influx);
    const chart = require('./routes/chart')(influx);
    const channel = require('./routes/channel')(influx);
    const stream = require('./routes/stream')();
    const users = require('./routes/users')();

    app.use('/', index);
    app.use('/chart', chart);
    app.use('/channel', channel);
    app.use('/stream', stream);
    app.use('/users', users);

    app.listen(config.port, () => {
      console.log(`Start server on localhost:${config.port}`);
      require('./ws')(influx);
  });
  })
  .catch(err => {
    console.error(`Error creating Influx database! ${err}`);
  })
}, err => { console.log(err); });