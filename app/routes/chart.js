module.exports = (function(influx){
    const express = require('express');


    const router = express.Router();


    router.get('/', (req, res) => {
        const { channel, stream } = req.query;
        res.render('./pages/chart.ejs', {channel: channel, stream: stream});
    });

    router.get('/data', (req, res) => {
        const {channel, stream, series, period, page} = req.query;
        if(series !== "5s" && series !== "1m"){
            res.status(404).send('User not found!');
        }

        if(period !== "2h" && period !== "7d"){
            res.status(404).send('User not found!');
        }
        let timeCondition = `time > now() - ${period}`;
        if(page > 1){
            const currentPeriod = parseInt(period);
            const periodSign = period.substr(-1, 1);
            timeCondition = `time > now() - ${parseInt(page) * currentPeriod}${periodSign} AND time < now() - ${(parseInt(page) - 1) * currentPeriod}${periodSign}`;
        }
        console.log(timeCondition);
        influx.query(`SELECT round(mean("bitrate") * 1) / 1 AS "bitrate", round(mean("fps") * 1) / 1 AS "fps", min("bitrate") AS  "min_bitrate" FROM stream_data WHERE ${timeCondition} AND channel='${channel}' AND stream='${stream}' GROUP BY time(${series}) FILL(0);`).then(result => {
            res.json(result);
        }).catch(err => {
            res.status(500).send(err.stack);
        })
    });

    return router;
});