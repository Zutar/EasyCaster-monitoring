const express = require('express');
const ejs = require('ejs');
const Influx = require('influx');
const path = require('path');
const config = require('./config');
const index = require('./routes/index');


const app = express();

app.use('/', index);
app.use('/static', express.static(path.join(__dirname, '/static')));
app.set('view engine', ejs);

const influx = new Influx.InfluxDB({
    host: config.db.host,
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

influx.getDatabaseNames()
.then(names => {
  if (!names.includes('monitoring')) {
    return influx.createDatabase('monitoring');
  }
})
.then(() => {
  app.listen(config.port, () => {
    console.log(`Start server on localhost:${config.port}`);
    require('./ws')(influx);
});
})
.catch(err => {
  console.error(`Error creating Influx database! ${err}`);
})