const { parse } = require('influx/lib/src/results');
const WebSocket = require('ws');

module.exports = ((influx) => {
    const wss = new WebSocket.Server({ port: 8081 });

    wss.on('connection', function connection(ws){
        ws.on('message', incoming);
    });

    function incoming(message){
        message = JSON.parse(message);
        if(message.type === "stream"){
            for(let i = 0; i < message.data.length; i++){
                pointToDB(message.data[i]);
            }
        }
    }

    function pointToDB(data){
        const {bitrate, fps, time, server, channel, stream} = data;
        
        bitrate = parseFloat(bitrate);
        fps = parseInt(fps);
        
        influx.writePoints([
            {
                measurement: 'stream_data',
                tags: { 'server': server, 'channel': channel, 'stream': stream},
                fields: { bitrate: bitrate, fps: fps, time: time },
            }
        ]).catch(err => {
            console.error(`Error saving data to InfluxDB! ${err.stack}`)
        })
    }
});