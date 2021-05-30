#!/usr/bin/env python3

"""

 Stream checker for supervisorctl
 Python 3.6+

"""

from datetime import datetime
from time import sleep
from xmlrpc.client import ServerProxy


servers = {
    'test-monitoring':  'http://user:123@109.108.92.138:8080/RPC2',

}

excluded_channels = {
    'None',
    'Null',
    '!_STREAMS_CHECK',
    '!_STREAMS_PARSER',
}

search_factor = 3


def get_server(uri):
    try:
        server = ServerProxy(uri, verbose=False)
        return server
    except Exception as exp:
        print('Server is unreachable: ', exp)

def parse_channel_list(server):
    try:
        channel_list = server.supervisor.getAllProcessInfo()
        for channel in channel_list:
            if channel['name'] not in excluded_channels:
                if channel['statename'] != 'RUNNING':
                    print(f'{channel["name"]} - {channel["statename"]}')
                else:
                    print(f'{channel["name"]} - {channel["statename"]} - {get_stream_log(server, channel["name"])}')
            else:
                print(f'{channel["name"]} - {channel["statename"]} - EXCLUDED FROM MONITORING')
    except Exception as exp:
        print('parse_channel_list: ', exp)

def get_stream_log(server, channel_name):
    try:
        log_first = server.supervisor.tailProcessStdoutLog(channel_name, 0, 10000)[0]
        sleep(2)
        log_second = server.supervisor.tailProcessStdoutLog(channel_name, 0, 10000)[0]
        return parse_stream_log(server, channel_name, log_first, log_second)
    except Exception as exp:
        print('get_stream_log: ', exp)

def parse_stream_log(server, channel_name, log_first, log_second):
    if log_first == log_second:
        restart_stream(server, channel_name)
        return 'Found frozen process! - Restarting'

    if log_second.count('Past duration') > search_factor:
        restart_stream(server, channel_name)
        return 'Found Past duration warning! - Restarting'

    if log_second.count('Non-monotonous DTS in output stream') > search_factor:
        restart_stream(server, channel_name)
        return 'Found Non-monotonous DTS in output stream! - Restarting'

    if log_second.count('av_interleaved_write_frame(): Broken pipe') > search_factor:
        restart_stream(server, channel_name)
        return 'Found av_interleaved_write_frame(): Broken pipe! - Restarting'

    if log_second.count('invalid dropping') > search_factor:
        restart_stream(server, channel_name)
        return 'Found invalid dropping! - Restarting'

    return 'OK'

def restart_stream(server, channel_name):
    try:
        server.supervisor.stopProcess(channel_name)
        server.supervisor.startProcess(channel_name)
    except Exception as exp:
        print('restart_stream: ', exp)

def main():
    try:
        for key, value in servers.items():
            print('\n***** {}: processing started {} ******'.format(key, datetime.now().strftime('%d/%m/%Y, %H:%M:%S')))
            server = get_server(value)
            parse_channel_list(server)
            print('***** {}: end of processing {} ******'.format(key, datetime.now().strftime('%d/%m/%Y, %H:%M:%S')))
    except KeyboardInterrupt:
        exit(1)

if __name__ == "__main__":
    main()