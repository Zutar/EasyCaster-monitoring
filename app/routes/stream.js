module.exports = (function(){
    const express = require('express');
    const Channel = require('../models/Channel');
    const bodyParser = require('body-parser');
    const mongoose = require('mongoose');
    const { auth } = require('../utils.js');

    const router = express.Router();
    const jsonParser = bodyParser.json();


    router.post('/add', auth('admin'), jsonParser, async (req, res) => {
        const { channelId, name } = req.body;

        if(channelId && name){
            const channel = await Channel.findOneAndUpdate({
                _id: mongoose.Types.ObjectId(channelId)
            }, {
                $push: {streams: {name: name}}
            });

            if(channel){
                res.send({message: 'Done'});
            }else{
                res.status(500).send({message: 'DB error!'});
            }
        }else{
            res.status(404).send({message: 'Can`t find channelId or name!'});
        }
    });

    router.delete('/', auth('admin'), jsonParser, async (req, res) => {
        const {channelId, streamId} = req.body;
        if(!channelId || !streamId) res.status(404).send({message: 'Stream id not found'});

        const channel = await Channel.findOne( {_id: mongoose.Types.ObjectId(channelId)});
        const stream = await channel.streams.pull({_id: streamId});
        await channel.save();

        if(stream){
            res.send({message: 'Done'});
        }else{
            res.status(404).send({message: 'Stream id not found'});
        }
    });

    return router;
});