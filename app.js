const express = require('express');
const config = require('./config');
const Influx = require('influx');

//var root = new influxdb.InfluxDB('141.105.134.188', 8086, 'root', 'root');

const influx = new Influx.InfluxDB({
    host: config.db.host,
    database: 'monitoring',
    schema: [
      {
        measurement: 'stream_data',
        fields: {
          bitrate: Influx.FieldType.INTEGER,
          fps: Influx.FieldType.INTEGER
        },
        tags: [
          'stream'
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
    const index = require('./routes/index')(influx);
    const app = express();

    app.use('/', index);
    app.set('view engine', 'ejs');

    app.listen(config.port, () => {
        console.log(`App listening at http://localhost:${config.port}`);
    });
  })
  .catch(err => {
    console.error(`Error creating Influx database! ${err}`);
  })