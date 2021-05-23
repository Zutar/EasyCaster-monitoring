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
  cookie: { maxAge: 60000 },
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

mongoose.connect(`mongodb://${config.mongo.user}:${config.mongo.password}@${config.mongo.host}:${config.mongo.port}/${config.mongo.db}`, { useUnifiedTopology: true, useNewUrlParser: true }).then(() => {  
  influx.getDatabaseNames()
  .then(names => {
    if (!names.includes('monitoring')) {
      return influx.createDatabase('monitoring');
    }
  })
  .then(() => {
    const index = require('./routes/index')(influx);
    app.use('/', index);

    app.listen(config.port, () => {
      console.log(`Start server on localhost:${config.port}`);
      require('./ws')(influx);
  });
  })
  .catch(err => {
    console.error(`Error creating Influx database! ${err}`);
  })
}, err => { console.log(err); });