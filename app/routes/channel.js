module.exports = (function(influx){
    const express = require('express');
    const Channel = require('../models/Channel');
    const User = require('../models/User');
    const bodyParser = require('body-parser');
    const mongoose = require('mongoose');
    const { auth, getChannelsStat, getStreamStatus } = require('../utils.js');

    const router = express.Router();
    const jsonParser = bodyParser.json();


    router.post('/list', jsonParser, (req, res) => {
        const limit = 10;
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
                if(result[0].role === 'admin') match = {};
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
                    if(channels.length === 0) return res.status(404).send({channels: [], page: 0, channels_filter: []});
                    match = result[0].role === 'admin' ? {} :  { ownerArray: result[0]._id };
                    Channel.aggregate([{
                        $match: match,
                    },
                        {
                            $project: {
                                name: 1
                            }
                        }]).then(channels_list => {
                        Channel.countDocuments(match).then((count) => {
                            getChannelsStat(influx, channels).then(result => {
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

    router.get('/list', auth('admin'), async (req, res) => {
        let channel = await Channel.aggregate([
            {
                $limit: 100
            }
        ]);

        channel = await Channel.populate(channel, {path: "ownerArray"});

        res.send({data: channel});
    });

    router.put('/', auth('admin'), jsonParser, async (req, res) => {
        const { id, name, owners } = req.body;
        if(owners.length === 0) return res.status(404).send({message: 'Need at least one owner!', status: false});

        const users = await User.aggregate([{
            $project: {
                name: 1
            },
        },
            {
                $match: {
                    name: {$in: owners}
                }
            }]);

        if(users.length > 0) {
            const channel = await Channel.findOneAndUpdate({
                    _id: mongoose.Types.ObjectId(id)
                },
                {
                    ownerArray: users,
                    name: name
                });

            if (channel) {
                res.send({message: 'Done', status: true});
            } else {
                res.send(404).send({message: 'Some data is incorrect!', status: false});
            }
        }else{
            res.status(404).send({message: 'Some data is incorrect!', status: false});
        }
    });

    router.delete('/', auth('admin'), jsonParser, async (req, res) => {
        const id = req.body.id;
        if(!id) res.status(404).send({message: 'Channel id not found'});
        const channel = await Channel.findOneAndDelete({_id: mongoose.Types.ObjectId(id)});

        if(channel){
            res.send({message: 'Done'});
        }else{
            res.status(404).send({message: 'Channel id not found'});
        }
    });

    router.get('/add', auth('admin'), (req, res) => {
        res.render('./pages/index.ejs');
    });

    router.post('/add', auth('admin'), jsonParser, async (req, res) => {
        const { owners = [], name, streams = [] } = req.body;
        if(owners.length === 0) return res.status(404).send({message: 'Need at least one owner!', status: false});

        const users = await User.aggregate([{
            $project: {
                name: 1
            },
        },
            {
                $match: {
                    name: {$in: owners}
                }
            }]);

        if(users.length > 0) {
            const channel = await Channel.create({
                ownerArray: users,
                name: name,
                streams: streams
            });

            if (channel) {
                res.send({message: 'Done', status: true});
            } else {
                res.send(404).send({message: 'Some data is incorrect!', status: false});
            }
        }else{
            res.status(404).send({message: 'Some data is incorrect!', status: false});
        }
    });

    return router;
});