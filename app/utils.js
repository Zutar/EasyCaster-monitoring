const User = require('./models/User');

module.exports = {
    auth(role){
        return async (req, res, next) => {
            const user = req.query.user || req.session.user;

            if (!user) return res.status(404).send('User not found!');

            const result = await User.findOne({name: user});
            if(result && result.name === user){
                req.session.user = user;
                if(role && role !== result.role) return res.status(404).send('Role not found!');
            }else{
                return res.status(404).send('User not found!');
            }

            next();
        }
    },
    async getUserInfo(req){
        const user = req.query.user || req.session.user;
        const result = await User.findOne({name: user});
        return result;
    }
    ,
    getChannelsStat(influx, channels){
        let query = '';
        channels.forEach(channel => {
            const channelName = channel.name;
            channel.streams.forEach(stream => {
                const streamName = stream.name;
                query += `(channel='${channelName}' AND stream='${streamName}') OR `;
            });
        });

        query += query.substr(0, query.length - 4);
        return influx.query(`SELECT fps, bitrate, uptime FROM "stream_data" WHERE (${query}) GROUP BY channel, stream ORDER BY time DESC LIMIT 2;`);
    },
    getStreamStatus(streamData){
        let code = 1;
        if (!streamData) {
            code = -1;
        } else if (streamData.length < 2) {
            code = 0;
        }

        let lastData = null;
        let prevData = null;
        if (code !== -1) {
            streamData = streamData.rows;
            lastData = streamData[0];
            prevData = streamData[1];
        } else {
            return {code: code, message: ''};
        }

        const lastPointTime = lastData.time.getNanoTime();
        const timeDiff = (Date.now() - lastPointTime / 1000000);

        if (code !== -1 && lastData && prevData) {
            if(lastData.bitrate === prevData.bitrate || timeDiff > 15000){
                code = 0;
            }else{
                code = 1;
            }
        }else{
            code = -1;
        }

        return {code: code, message: ''};
    }
}