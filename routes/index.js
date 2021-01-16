module.exports = (function(clickhouse){
    'use strict'
    const express = require('express');
    const bodyParser = require('body-parser');
    const router = express.Router();

    router.use(bodyParser.json({limit:'5mb'}));
    router.use(bodyParser.urlencoded({
        extended: true,
        limit:'5mb'
    }));

    router.get('/', (req, res) => {
        const query = 'SELECT * FROM stream_data;';
        clickhouse.query(query).exec(function (err, rows) {
            console.log(rows);
        });
        res.render('./pages/index.ejs');
    });

    // Error page
    router.use(function(req, res, next){
        res.status(404);
        res.render('./error/404.ejs', {root: '../' + __dirname});
    });
    
    return router;
});