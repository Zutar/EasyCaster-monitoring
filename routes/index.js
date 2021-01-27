module.exports = (function(clickhouse){
    'use strict'
    const express = require('express');
    const bodyParser = require('body-parser');
    const { spawn } = require('child_process');
    const router = express.Router();

    const cmd = 'ffmpeg -i rtmp://cdn10.live-tv.od.ua/7tvod/7tvod -c copy -f mpegts udp://127.0.0.1:11111?pkt_size=1316';
    const cmdArray = cmd.split(' ');
    const firstCmdItem = cmdArray.shift();
    let child = null;
    

    router.use(bodyParser.json({limit:'5mb'}));
    router.use(bodyParser.urlencoded({
        extended: true,
        limit:'5mb'
    }));

    router.get('/', (req, res) => {
        if(child){
            try{
                child.stdin.pause();
                child.kill();
            }catch(e){
                console.log(e);
            }
        }
        
        child = spawn(firstCmdItem, cmdArray);

        child.stderr.on('data', (data) => {
            if(data.indexOf('fps') !== -1 && 
               data.indexOf('bitrate') !== -1 && 
               data.indexOf('frame') !== -1){
                const parametersArray = data.toString().split('=');
                const fps = parseInt(parametersArray[2].trim().split(' ')[0]);
                const bitrate = parseInt(parametersArray[6].trim().split(' ')[0]);
                //console.log(`fps: ${fps}\nbitrate: ${bitrate}\n\n`);
                
                const query = `INSERT INTO stream_data VALUES(now(), ${fps}, ${bitrate});`;
                clickhouse.query(query).exec(function (err, rows) {
                    //console.log(rows);
                });
            }
        });

        res.render('./pages/index.ejs');
    });

    router.get('/chart', (req, res) => {
        res.render('./pages/chart.ejs');
    });

    router.get('/getChart', (req, res) => {
        const query = `SELECT * FROM stream_data ORDER BY timestamp DESC LIMIT 87000 OFFSET 100;`;
        clickhouse.query(query).exec(function (err, rows) {
            res.send(rows);
        });
    });

    
    return router;
});