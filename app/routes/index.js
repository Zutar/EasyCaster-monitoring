module.exports = (function(influx){
    const express = require('express');
    const Channel = require('../models/Channel');
    const User = require('../models/User');
    const mongoose = require('mongoose');
    const bodyParser = require('body-parser');


    let jsonParser = bodyParser.json()
    let urlencodedParser = bodyParser.urlencoded({ extended: false })
    
    const router = express.Router();


    function getChannelsStat(channels){
        let query = '';
        channels.forEach(channel => {
            const channelName = channel.name;
            channel.streams.forEach(stream => {
                const streamName = stream.name;
                query += `(channel='${channelName}' AND stream='${streamName}') OR `;
            });
        });

        query += query.substr(0, query.length - 4);
        return influx.query(`SELECT fps, bitrate, uptime FROM "stream_data" WHERE (${query}) GROUP BY channel, stream ORDER BY time DESC LIMIT 2;`);
    }
// time > now() - 5m AND (${query})
    router.get('/', (req, res) => {
        const user = req.session.user || req.query.user;
        if(!user) return res.status(404).send('User not found!');

        req.session.user = user;
        res.render('./pages/index.ejs');
    });

    router.post('/channels', jsonParser, (req, res) => {
        const limit = 2;
        const user = req.session.user || req.query.user;
        const filter = req.body.filter || '';

        let page = req.body.page ? parseInt(req.body.page) : 0;
        page = page <= 0 ? 0 : page;

        User.aggregate([{
            $match: {
                name: user
            }
        }]).then(result => {
            if(result.length > 0){
                let match = {
                    ownerArray: result[0]._id
                }
                if(filter) match.name = filter
                Channel.aggregate([
                {
                    $match: match
                },
                {
                    $skip: page
                },
                {
                    $limit: limit
                }]).then(channels => {
                    if(channels.length === 0) res.status(404).send('Channels not found!');
                    Channel.aggregate([{
                        $match: {
                            ownerArray: result[0]._id
                        },
                    },                        
                    {
                        $project: {
                            name: 1
                        }
                    }]).then(channels_list => {
                        Channel.countDocuments(match).then((count) => {
                            getChannelsStat(channels).then(result => {
                                for(let i = 0; i < channels.length; i++){
                                    for(let j = 0; j < result.groupRows.length; j++){
                                        const channel = channels[i];
                                        const influxChannel = result.groupRows[j].tags;
                                        const influxChannelData = result.groupRows[j].rows;
                                        if(channel.name === influxChannel.channel){
                                            for(let k = 0; k < channel.streams.length; k++){
                                                if(channel.streams[k].name === influxChannel.stream){
                                                    channel.streams[k].data = result.groupRows[j];
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }

                                res.send({channels: channels, counter: count, page: page, limit: limit, channels_filter: channels_list, filter: filter});
                            }).catch(err => {
                                console.log(err);
                            });
                        });
                    });
                });
            }else{
                res.status(404).send('User not found!');
            }
        });
    });

    router.get('/chart', (req, res) => {
        const { channel, stream } = req.query;
        res.render('./pages/chart.ejs', {channel: channel, stream: stream});
    });

    router.get('/chart/data', (req, res) => {
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