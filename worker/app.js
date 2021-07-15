process.env.FFPROBE_PATH = require('ffprobe-static').path;
const ffprobe = require('ffprobe-client')
const WebSocket = require('ws');
const fs = require('fs');

const time = 5000;
const localServerIP = '109.108.92.138';
const wsServerAddress = 'ws://109.108.92.138:8081';
let json = {};
let connected = false;

let ws = startWS();

ws.on('error', (err) => {
    console.log(err);
   clearInterval(timerId);
});

const timerId = setInterval(() => {
    if(!connected) return;
    getStreamsData(json);
}, time);

ws.on('open', function open() {
    console.log('connected');
    fs.readFile('./streams.json', (err, result) => {
        json = JSON.parse(result);
        connected = true;
    });
});

ws.on('ping', heartbeat);

ws.on('clsoe', function close() {
    console.log('close');
    connected = false;
    clearTimeout(this.pingTimeout);
});

function startWS(){
    return new WebSocket(wsServerAddress, {
        headers: {
            'x-api-token': 'yIhLCXjVi1KJvCKdXtzRfCQ86Px7mGS9'
        }
    });
}

async function getStreamsData(data){
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
                "server": localServerIP,
                "channel": channelName,
                "stream": stream.name,
                "fps": fps,
                "bitrate": bitrate,
                "time": time
            });
        };
    };
    const streamsData = {"type": "stream", "data": streamsDataArray};
    ws.send(JSON.stringify(streamsData));
}

function heartbeat() {
    clearTimeout(this.pingTimeout);

    this.pingTimeout = setTimeout(() => {
        connected = false;
        this.terminate();
        setTimeout(() => {
            startWS();
        }, 30000);
    }, 10000 + 1000);
}