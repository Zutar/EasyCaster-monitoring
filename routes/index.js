module.exports = (function(clickhouse){
    'use strict'
    const express = require('express');
    const bodyParser = require('body-parser');
    const { spawn } = require('child_process');
    const router = express.Router();

    const cmd = 'ffmpeg -i rtmp://cdn10.live-tv.od.ua/7tvod/7tvod -aspect 4:3 -threads 2 -flags cgop+ilme -preset fast -profile:v main -c:v libx264 -pix_fmt yuv420p -b:v 2500k -maxrate 2500k -bufsize 625k -g 50 -keyint_min 25 -bf 2 -c:a mp2 -b:a 192k -ar 48000 -ac 2 -f mpegts -flush_packets 0 udp://127.0.0.1:1111?pkt_size=1316&fifo_size=50000';
    const cmdArray = cmd.split(' ');
    const firstCmdItem = cmdArray.shift();
    

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
        
        let child = spawn(firstCmdItem, cmdArray);

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
        const query = `SELECT * FROM stream_data;`;
        clickhouse.query(query).exec(function (err, rows) {
            console.log(rows);
            console.log(rows.body);
            console.log(rows.result);
            console.log(rows[0]);
        });
    });

    // Error page
    router.use(function(req, res, next){
        res.status(404);
        res.render('./error/404.ejs', {root: '../' + __dirname});
    });
    
    return router;
});