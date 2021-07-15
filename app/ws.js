const { parse } = require('influx/lib/src/results');
const WebSocket = require('ws');

module.exports = ((influx) => {

    const wss = new WebSocket.Server({ port: 8081 });

    wss.on('connection', function connection(ws, req){
        liveTVAPI = "yIhLCXjVi1KJvCKdXtzRfCQ86Px7mGS9";
        console.log("connect", req.headers);
        if(req.headers["x-api-token"] === liveTVAPI){
            ws.on('message', incoming);
        }else{
            ws.close();
        }
    });

    function incoming(message){
        console.log(message);
        message = JSON.parse(message);
        console.log(message.type);
        if(message.type === "stream"){
            for(let i = 0; i < message.data.length; i++){
                pointToDB(message.data[i]);
            }
        }
    }

    function pointToDB(data){
        let {bitrate, fps, time, server, channel, stream} = data;
        bitrate = parseFloat(bitrate) || 0;
        fps = parseInt(fps) || 0;
        console.log(bitrate);
        influx.writePoints([
            {
                measurement: 'stream_data',
                tags: { 'server': server, 'channel': channel, 'stream': stream},
                fields: { bitrate: bitrate, fps: fps, uptime: time },
            }
        ]).catch(err => {
            console.error(`Error saving data to InfluxDB! ${err.stack}`);
        })
    }
});