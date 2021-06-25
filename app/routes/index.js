module.exports = (function(influx){
    const express = require('express');
    const bodyParser = require('body-parser');
    const { auth, getUserInfo } = require('../utils.js');


    const jsonParser = bodyParser.json();
    const router = express.Router();


    router.get('/', auth(), (req, res) => {
        const user = getUserInfo(req);
        user.then(result => {
            res.render('./pages/index.ejs', { role: result.role });
        });
    });

    router.get('/channels', auth('admin'), async (req, res) => {
        res.render('./pages/channels.ejs');
    });

    return router;
});