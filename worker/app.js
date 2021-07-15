process.env.FFPROBE_PATH = require('ffprobe-static').path;
const ffprobe = require('ffprobe-client')
const WebSocket = require('ws');
const fs = require('fs');

const ws = new WebSocket('ws://109.108.92.138:8081');
const time = 5000;
const serverIP = '109.108.92.138';

ws.on('open', function open() {
    fs.readFile('./streams.json', (err, json) => {
        json = JSON.parse(json);
        setInterval(() => {
            getStreamsData(json);
        }, time);
    });
    //ws.send('something');
});

function getStreamsData(data){
    data.forEach(channel => {
        const channelName = channel.name;
        const streamsDataArray = [];
        channel.streams.forEach(async (stream) => {
            const ffprobeResult = await ffprobe(stream.url);
            const videoStream = ffprobeResult.streams[0];

            const bitrate = videoStream.tags.variant_bitrate;
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

        });

        const streamsData = {"type": "stream", "data": data};
        console.log(streamsData);
        ws.send(JSON.stringify(streamsData));
    });
}

//
// ws.on('message', function incoming(data) {
//     console.log(data);
// });