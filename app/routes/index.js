module.exports = (function(influx){
    const express = require('express');
    const Channel = require('../models/Channel');
    const User = require('../models/User');
    const bodyParser = require('body-parser');


    const jsonParser = bodyParser.json();
    const router = express.Router();

    function checkUser(req, res, next){
        const user = req.session.user || req.query.user;
        console.log(req.session.user, req.query.user);
        if(!user) return res.status(404).send('User not found!');
        req.session.user = user;

        next();
    }

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

    function getStreamStatus(streamData){
        let code = 1;
        if(!streamData){
            code = -1;
        } else if(streamData.length < 2){
            code = 0;
        }

        let lastData = null;
        let prevData = null;
        if(code === 1) {
            streamData = streamData.rows;
            lastData = streamData[0];
            prevData = streamData[1];
        }else if(code === -1){
            lastData = {"time": "-", "fps": 0, "bitrate": 0, "uptime": "0"}
            prevData = {"time": "-", "fps": 0, "bitrate": 0, "uptime": "0"}
        }
        const timeDiff = new Date() - new Date(lastData.time);
        if((lastData.uptime === prevData.uptime || lastData.bitrate === prevData.bitrate || timeDiff > 30000) && code !== -1){
            code = 0;
        }

        return {code: code, message: ''};
    }

    router.get('/', checkUser, (req, res) => {
        res.render('./pages/index.ejs');
    });

    router.post('/channel/list', jsonParser, (req, res) => {
        const limit = 2;
        const user = req.session.user || req.query.user;
        const filter = req.body.filter || '';

        let page = req.body.page ? parseInt(req.body.page) : 0;
        let skip = page * limit;
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
                    $skip: skip
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
                                        if(channel.name === influxChannel.channel){
                                            for(let k = 0; k < channel.streams.length; k++){
                                                if(channel.streams[k].name === influxChannel.stream){
                                                    channel.streams[k].data = result.groupRows[j];
                                                    channel.streams[k].status = getStreamStatus(channel.streams[k].data);
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

    router.get('/channel', checkUser, (req, res) => {
        res.render('./pages/index.ejs');
    });

    router.put('/channel', checkUser, (req, res) => {
        res.render('./pages/index.ejs');
    });
    
    router.delete('/channel', checkUser, (req, res) => {
        res.render('./pages/index.ejs');
    });

    router.get('/channel/add', checkUser, (req, res) => {
        res.render('./pages/index.ejs');
    });

    router.post('/channel/add', checkUser, (req, res) => {
        res.render('./pages/index.ejs');
    });

    return router;
});