const express = require('express');
const config = require('./config');
const index = require('./routes/index')();
const { ClickHouse } = require('clickhouse');

const clickhouse = new ClickHouse({
    url: 'http://localhost',
    port: 8123,
    debug: true,
    basicAuth: {
        username: 'default',
        password: '',
        },
    isUseGzip: false,
    format: "json", // "json" || "csv" || "tsv"
    config: {
        session_id                              : 'session_id if neeed',
        session_timeout                         : 60,
        output_format_json_quote_64bit_integers : 0,
        enable_http_compression                 : 0,
        database                                : 'my_database_name',
    }
});

const app = express();

app.use('/', index);
app.set('view engine', 'ejs');

console.log();

app.listen(config.port, () => {
    console.log(`App listening at http://localhost:${config.port}`);
});