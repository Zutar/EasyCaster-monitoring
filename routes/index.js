module.exports = (function(influx){
    'use strict'
    const express = require('express');
    const bodyParser = require('body-parser');
    const { spawn } = require('child_process');
    const router = express.Router();

    const cmd = 'ffmpeg -i rtmp://cdn10.live-tv.od.ua:1935/odlive/720p -c copy -f mpegts udp://127.0.0.1:11111?pkt_size=1316';
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

                influx.writePoints([
                    {
                      measurement: 'stream_data',
                      tags: { stream: '1' },
                      fields: { bitrate: bitrate, fps: fps },
                    }
                  ]).catch(err => {
                    console.error(`Error saving data to InfluxDB! ${err.stack}`)
                  })
            }
        });
        

        res.render('./pages/index.ejs');
    });

    router.get('/chart', (req, res) => {
        res.render('./pages/chart.ejs');
    });

    router.get('/getChart', (req, res) => {
        influx.query(`SELECT round(mean("bitrate") * 1) / 1 AS "bitrate", round(mean("fps") * 1) / 1 AS "fps", min("bitrate") AS  "min_bitrate" FROM stream_data WHERE time > now() - 7d GROUP BY time(1m) FILL(0)`).then(result => {
            res.json(result);
        }).catch(err => {
            res.status(500).send(err.stack);
        })
    });

    return router;
});