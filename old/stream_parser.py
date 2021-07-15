#!/usr/bin/env python3

"""

 Stream parser
 Python 3.6+

"""

from datetime import datetime
from time import sleep
from xmlrpc.client import ServerProxy
import json
import websocket
from apscheduler.schedulers.background import BackgroundScheduler
import time
import socket


excluded_channels = {
    'None',
    'Null',
    '!_STREAMS_CHECK',
    '!_STREAMS_PARSER',
}

isEnabled = False
wsServer = 'ws://localhost:8081'
supervisorServer = 'http://user:123@109.108.92.138:8080/RPC2'
serverIP = '109.108.92.138'


def get_server(uri):
    server = ServerProxy(uri, verbose=False)
    return server

def parse_channel_list(server):
    channel_list = server.supervisor.getAllProcessInfo()
    channelDataList = []
    for channel in channel_list:
        if channel['name'] not in excluded_channels:
            log = get_stream_log(server, channel["name"]).strip().split(" ")
            items = parse_stream_items(channel["name"], log)
            if items:
                channelDataList.append(items)
    return channelDataList

def parse_stream_items(channel, log):
    if log:
        fps = 0
        bitrate = 0
        time = 0
        channel, stream = channel.split("_")
        for i in range(len(log)):
            if log[i].find("fps") != -1:
                fps = log[i + 1]
            elif log[i].find("time") != -1:
                time = log[i].split("=")[1]
            elif log[i].find("bitrate") != -1:
                bitrate = log[i].split("=")[1]

        streamObject = {
            "server": serverIP,
            "channel": channel,
            "stream": stream,
            "fps": fps,
            "bitrate": bitrate,
            "time": time
        }

        return streamObject
    else:
        return False

def get_stream_log(server, channel_name):
    return server.supervisor.tailProcessStdoutLog(channel_name, 0, 100)[0]

def getResult():
    try:
        server = get_server(supervisorServer)
        data = parse_channel_list(server)
        if data: return {"type": "stream", "data": data}
    except KeyboardInterrupt:
        return []

def sendResult(ws):
    if isEnabled is False: return False
    data = getResult()
    if len(data) > 0:
        ws.send(json.dumps(data))

# WS - start

def on_message(ws, message):
    print(message)

def on_error(ws, error):
    print(error)

def on_close(ws):
    global isEnabled
    print("### closed ###")
    isEnabled = False

def on_open(ws):
    global isEnabled
    print("Connected!")
    isEnabled = True

# WS - end 

def main():
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp(wsServer, on_open = on_open, on_message = on_message, on_error = on_error, on_close = on_close)

    scheduler = BackgroundScheduler()
    scheduler.add_job(sendResult, 'interval', [ws], seconds=5)
    scheduler.start()

    ws.run_forever()


if __name__ == "__main__":
    main()