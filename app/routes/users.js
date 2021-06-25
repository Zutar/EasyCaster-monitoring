module.exports = (function(){
    const express = require('express');
    const User = require('../models/User');
    const Channel = require('../models/Channel');
    const bodyParser = require('body-parser');
    const mongoose = require('mongoose');
    const { auth } = require('../utils.js');

    const router = express.Router();
    const jsonParser = bodyParser.json();


    router.get('/', auth('admin'), async (req, res) => {
        res.render('./pages/users.ejs');
    });

    router.post('/', auth('admin'), jsonParser, async (req, res) => {
        const { name, role, company } = req.body;
        if(name && role && company){
            const user = await User.create({
                name: name,
                company: company,
                role: role
            });
            if(user){
                res.send({message: 'Done'});
            }else{
                res.send(404).send({message: 'Some data is incorrect!'});
            }
        }else{
            res.send(404).send({message: 'Some data is incorrect!'});
        }
    });

    router.delete('/', auth('admin'), jsonParser, async (req, res) => {
        const { id } = req.body;
        if(!id) return res.status(404).send({message: 'User id not found!'});

        const user = await User.findOneAndDelete({_id: mongoose.Types.ObjectId(id)});
        if(user){
            const channels = await Channel.find( {});
            channels.forEach(channel => {
                channel.ownerArray.pull(id);
                channel.save();
            });

            res.send({message: 'Done'});
        }else{
            res.send(404).send({message: 'User id not found!'});
        }
    });

    router.get('/list', auth('admin'), async (req, res) => {
        let users = await User.aggregate([
            {
                $limit: 100
            }
        ]);

        res.send({data: users});
    });

    return router;
});