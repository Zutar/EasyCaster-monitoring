process.env.FFPROBE_PATH = require('ffprobe-static').path;
const ffprobe = require('ffprobe-client')
const WebSocket = require('ws');
const fs = require('fs');

const wss = new WebSocket('ws://109.108.92.138:8081', {
    headers: {
        'x-api-token': 'yIhLCXjVi1KJvCKdXtzRfCQ86Px7mGS9'
    }
});
const time = 5000;
const serverIP = '109.108.92.138';
let connected = false;
let timerId = null;

ws.on('open', function open() {
    console.log('connected');
    fs.readFile('./streams.json', (err, json) => {
        json = JSON.parse(json);
        connected = true;
        timerId = setInterval(() => {
            getStreamsData(json);
        }, time);
    });
});

client.on('ping', heartbeat);

ws.on('clsoe', function close() {
    console.log('close');
    connected = false;
    clearTimeout(this.pingTimeout);
    clearInterval(timerId);
});

async function getStreamsData(data){
    if(!connected) return;
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

    // Use `WebSocket#terminate()`, which immediately destroys the connection,
    // instead of `WebSocket#close()`, which waits for the close timer.
    // Delay should be equal to the interval at which your server
    // sends out pings plus a conservative assumption of the latency.
    this.pingTimeout = setTimeout(() => {
        this.terminate();
    }, 10000 + 1000);
}

//
// ws.on('message', function incoming(data) {
//     console.log(data);
// });