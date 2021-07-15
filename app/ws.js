const { parse } = require('influx/lib/src/results');
const WebSocket = require('ws');

module.exports = ((influx) => {

    const wss = new WebSocket.Server({ port: 8081 });

    wss.on('connection', function connection(ws, req){
        liveTVAPI = "yIhLCXjVi1KJvCKdXtzRfCQ86Px7mGS9";
        console.log(req.headers);
        if(req.headers["x-api-token"] === liveTVAPI){
            ws.isAlive = true;
            ws.on('pong', heartbeat);
            ws.on('message', incoming);
        }else{
            ws.close();
        }
    });

    const interval = setInterval(function ping() {
        wss.clients.forEach(function each(ws) {
            if (ws.isAlive === false) return ws.terminate();

            ws.isAlive = false;
            ws.ping(noop);
        });
    }, 10000);

    wss.on('close', function close() {
        clearInterval(interval);
    });

    function noop() {}

    function heartbeat() {
        this.isAlive = true;
    }

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
        console.log(data, data.bitrate);
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