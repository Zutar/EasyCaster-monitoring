module.exports = (function(client){
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

                const time = new Date();
                const query = `INSERT INTO stream_data VALUES(now(), ${fps}, ${bitrate});`;
                
                client.query(query, (error, result, fields) => {
                    console.log(error);
                });
            }
        });
        

        res.render('./pages/index.ejs');
    });

    router.get('/chart', (req, res) => {
        res.render('./pages/chart.ejs');
    });

    router.get('/getChart', (req, res) => {
        const query = `SELECT series.minute as datetime, coalesce(cnt.amnt, 0) as bitrate from (
            SELECT AVG(bitrate) amnt,
            to_timestamp(floor((extract('epoch' from timestamp) / 5 )) * 5)
            AT TIME ZONE 'UTC' as interval_alias
            from stream_data group by interval_alias
            ) cnt
         
         RIGHT JOIN 
            (    
            SELECT generate_series(min(date_trunc('hour',timestamp)),
            max(date_trunc('minute',timestamp)),'5s') as minute from stream_data
            ) series
       on series.minute = cnt.interval_alias;`;//`SELECT * FROM stream_data ORDER BY timestamp DESC LIMIT 2400 OFFSET 2400;`;

        client.query(query, (error, result, fields) => {
            res.send(result.rows);
        });
    });

    
    return router;
});