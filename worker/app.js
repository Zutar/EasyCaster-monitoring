process.env.FFPROBE_PATH = require('ffprobe-static').path;
const ffprobe = require('ffprobe-client')
const WebSocket = require('ws');
const fs = require('fs');

const time = 5000;
const serverIP = '109.108.92.138';
let json = {};
let connected = false;

function start(){
    return new Promise((resolve, reject) =>{
        const server = new WebSocket('ws://109.108.92.138:8081', {
            headers: {
                'x-api-token': 'yIhLCXjVi1KJvCKdXtzRfCQ86Px7mGS9'
            }
        });

        server.onopen = function() {
            console.log('t2');
            resolve(server);
        };
        server.onerror = function(err) {
            reject(err);
        };
    });
}

start().then(ws => {
    const timerId = setInterval(() => {
        console.log('t3');
        if(!connected) return;
        getStreamsData(json);
    }, time);

    ws.on('open', function open() {
        console.log('connected');
        fs.readFile('./streams.json', (err, result) => {
            json = JSON.parse(result);
            connected = true;
            console.log(connected);
        });
    });

    ws.on('ping', heartbeat);

    ws.on('clsoe', function close() {
        console.log('close');
        connected = false;
        clearTimeout(this.pingTimeout);
    });
}).catch((err) => {
    console.log(err);
});

async function getStreamsData(data){
    console.log('t1');
    const streamsDataArray = [];
    for(const channel of data){
        const channelName = channel.name;
        for(stream of channel.streams){
            const ffprobeResult = await ffprobe(stream.url);
            const videoStream = ffprobeResult.streams[0];

            const bitrate = (videoStream.tags.variant_bitrate / 1024).toFixed(2);
            const fps = 0;
            const time = '0';

            streamsDataArray.push({
                "server": serverIP,
                "channel": channelName,
                "stream": stream.name,
                "fps": fps,
                "bitrate": bitrate,
                "time": time
            });
        };
    };
    const streamsData = {"type": "stream", "data": streamsDataArray};
    console.log('t');
    ws.send(JSON.stringify(streamsData));
}

function heartbeat() {
    clearTimeout(this.pingTimeout);

    this.pingTimeout = setTimeout(() => {
        connected = false;
        this.terminate();
    }, 10000 + 1000);
}