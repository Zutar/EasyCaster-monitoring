window.onload = () => {
    getChannelsInfo(0, '');
}

const channelsFilter = (el) => {
    const channel = el.value;
    getChannelsInfo(0, channel);
}

document.querySelector('.channels__refresh').onclick = () => {
    const channelsFilter = document.querySelector('.channels__filter').value;
    getChannelsInfo(0, channelsFilter);
}

function getChannelsInfo(page, filter){
    const data = {
        page: page,
        filter: filter
    }

    fetch('/channel/list', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        renderChannels(data.channels);
        renderFilter(data.channels_filter, data.filter);
        renderPageList(data.page, data.limit, data.counter);
    });
}

function renderChannels(channels){
    const channelsTable = document.querySelector('.channels__table > tbody');
    removeAllExceptFirst(channelsTable);
    if(!channels || channels.length === 0){
        channelsTable.innerHTML += `    
               <tr class="channels__table-notfound">
                    <td colspan="7">Потоки отсутствуют</td>
               </tr>`;
        return;
    }
    channels.forEach((channel) => {
        channel.streams.forEach(stream => {
        let status = stream.status ? stream.status.code : -1;
        let streamData = stream.data;
        if(!streamData){
            status = -1;
        } else if(streamData.length < 2){
            status = 0;
        }

        let lastData = {"time": "-", "fps": 0, "bitrate": 0, "uptime": "0"};
        if(status !== -1) {
            streamData = streamData.rows;
            lastData = streamData[0];
        }

        let channelStatusClass = 'green';
        let channelStatusText = `Данные от ${new Date(lastData.time).toLocaleString()}`;
        let channelChartClass = '';

        if(status === 0){
            channelStatusClass = 'red';
            channelStatusText = `Поток неактивен!`;
        }else if(status === -1){
            channelStatusClass = 'red';
            channelStatusText = `Отсутствуют данные потока!`;
            channelChartClass = 'disabled';
        }
        const chartLink = status !== -1 ? `channel=${channel.name}&stream=${stream.name}` : '#';
        channelsTable.innerHTML += `    
             <tr>
                <td><div class="channels__status ${channelStatusClass}"></div><div class="channels__status-info">${channelStatusText}</div></td>
                <td>${channel.name}</td>
                <td><a href="#">${stream.name}</a></td>
                <td>${lastData.bitrate} kb/s</td>
                <td>${lastData.fps}</td>
                <td>${lastData.uptime}</td>
                <td><a href="/chart?${chartLink}" class="channels__chart ${channelChartClass}">График</a></td>
             </tr>`;
        });
    });
}

function renderFilter(channels, filter){
    const channelsFilter = document.querySelector('.channels__filter');
    channelsFilter.innerHTML = "<option value=''>All</option>";
    channels.forEach((channel) => {
        if(channel.name == filter){
        channelsFilter.innerHTML += `<option value=${channel.name} selected>${channel.name}</option>`;
        }else{
            channelsFilter.innerHTML += `<option value=${channel.name}>${channel.name}</option>`;
        }
    });
}

function renderPageList(page, limit, counter){
    const prevPageButton = document.querySelector('.channel__prev-page');
    const currentPageButton = document.querySelector('.current-page');
    const nextPageButton = document.querySelector('.channel__next-page');
    const pageList = document.querySelector('.channel__page-list');

    if(!limit || !counter){
        pageList.style.display = 'none';
        return;
    }else{
        pageList.style.display = 'flex';
    }

    pageList.querySelectorAll('li').forEach((el) => {
        el.style.display = 'block';
    });

    if(page <= 0) prevPageButton.style.display = 'none';
    if(counter <= (page + 1) * limit) nextPageButton.style.display = 'none';

    currentPageButton.textContent = page + 1;
    const channelFilter = document.querySelector('.channels__filter').value;

    prevPageButton.onclick = () => {
        getChannelsInfo(page - 1, channelFilter);
    }

    nextPageButton.onclick = () => {
        getChannelsInfo(page + 1, channelFilter);
    }
}

function removeAllExceptFirst(el) {
    while (el.children.length > 1) {
        el.removeChild(el.lastChild);
    }
}