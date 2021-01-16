module.exports = (function(client){
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
        console.log('Hello world');
        res.render('./pages/');
    });

    // Error page
    router.use(function(req, res, next){
        res.status(404);
        res.render('./error/404.ejs', {root: '../' + __dirname});
    });
    
    return router;
});