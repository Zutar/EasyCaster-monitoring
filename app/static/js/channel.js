const es = document.querySelectorAll('.input-categories');
for (let i = 0; i < es.length; i++) {
    es[i]._list = es[i].querySelector('ul');
    es[i]._input = es[i].querySelector('input');
    es[i]._input._icategories = es[i];
    es[i].onkeydown = function(event){
        let e = event || event;
        if(e.keyCode == 13) {
            let c = e.target._icategories;
            let li = document.createElement('li');
            li.innerHTML = c._input.value;
            c._list.appendChild(li);
            c._input.value = '';
            event.preventDefault();
        }
    }
}

const showAddChannel = document.querySelector('.channel__main-header-wrapper > button');
showAddChannel.onclick = () => {
    const block = document.querySelector('.channel__add-block');
    if(block.style.display === 'none' || !block.style.display){
        block.style.display = 'block';
        document.querySelector('.channel__label-add').style.display = 'inline-block';
        document.querySelector('.channel__label-edit').style.display = 'none';

        document.querySelector('.channel__add').style.display = 'inline-block';
        document.querySelector('.channel__edit').style.display = 'none';
    }else{
        block.style.display = 'none';
    }
}

const addChannel = document.querySelector('.channel__add');
addChannel.onclick = () => {
    const name = document.querySelector('.channel__add-block > input').value;
    const users = document.querySelectorAll('.input-categories > ul > li');
    const errorElem = document.querySelector('.channel__add-block > b');

    let usersArray = [];
    if(users && users.length > 0){
        for(let i = 0; i < users.length; i++){
            usersArray.push(users[i].textContent.trim());
        }
    }

    if(usersArray.length > 0){
        const data = {name: name.trim(), owners: usersArray};
        fetch('/channel/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
            .then(response => response.json())
            .then(data => {
                if(data.status){
                    location.reload();
                }else {
                    alert(data.message);
                }
            })
    }else{
        errorElem.textContent = 'Добавьте хотя бы одного пользователя!';
    }
}

const editButtonChannel = document.querySelector('.channel__edit');
editButtonChannel.onclick = () => {
    const name = document.querySelector('.channel__add-block > input').value;
    const users = document.querySelectorAll('.input-categories > ul > li');
    const errorElem = document.querySelector('.channel__add-block > b');
    const id = editButtonChannel.dataset.id;

    let usersArray = [];
    if(users && users.length > 0){
        for(let i = 0; i < users.length; i++){
            usersArray.push(users[i].textContent.trim());
        }
    }

    if(usersArray.length > 0){
        const data = { id: id, name: name.trim(), owners: usersArray };

        fetch('/channel', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
            .then(response => response.json())
            .then(data => {
                if(data.status){
                    location.reload();
                }else {
                    alert(data.message);
                }
            })
    }else{
        errorElem.textContent = 'Добавьте хотя бы одного пользователя!';
    }
}

window.onload = () => {
    getChannelInfo(0);
}

function getChannelInfo(page){
    fetch(`/channel/list?page=${page}`, {
        method: 'GET'
    })
        .then(response => response.json())
        .then(data => {
            renderChannels(data);
        })
}

function removeChannel(id){
    fetch('/channel', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({id: id})
    })
        .then(response => response.json())
        .then(data => {
            location.reload();
        })
}

function addStream(name, channelId){
    fetch('/stream/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({name: name, channelId: channelId})
    })
        .then(response => response.json())
        .then(data => {
            location.reload();
        })
}

function removeStream(channelId, streamId){
    fetch('/stream', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({channelId: channelId, streamId: streamId})
    })
        .then(response => response.json())
        .then(data => {
            location.reload();
        })
}

function editChannel(channel){
    const { _id: id, name } = channel;
    console.log(id, name);
    const block = document.querySelector('.channel__add-block');
    if(block.style.display === 'none' || !block.style.display){
        document.querySelector('.channel__name').value = name;

        block.style.display = 'block';
        document.querySelector('.channel__label-add').style.display = 'none';
        document.querySelector('.channel__label-edit').style.display = 'inline-block';

        document.querySelector('.channel__add').style.display = 'none';
        document.querySelector('.channel__edit').style.display = 'inline-block';

        document.querySelector('.channel__edit').dataset.id = channel._id;
    }else{
        block.style.display = 'none';
    }
}

function renderChannels(data){
    const table = document.querySelector('#channel__table > tbody');

    if(data.length === 0){
        const tr = `<tr><td colspan="4" class="channel__not">Каналы не обнаружены!</td></tr>`;
        table.innerHTML += tr;
    }else{
        data = data.data;
        data.forEach((channel) => {
            let users = '';
            if(channel.ownerArray && channel.ownerArray.length > 0){
                channel.ownerArray.forEach(user => {
                    users += `${user.name}, `;
                });
            }else{
                users = 'Отсутствуют';
            }
            const streamsCount = channel.streams.length;
            const tr = document.createElement('tr');
            users = users === 'Отсутствуют' ? users : users.slice(0, users.length - 2);
            const elem = `<td>${channel.name}</td>
                          <td>${streamsCount}</td>
                          <td>${users}</td>
                          <td><button class="edit-button">Редактировать</button><button class="delete-button">Удалить</button></td>`;
            tr.innerHTML = elem;

            // Remove channel
            const removeChannelButton = tr.querySelector('.delete-button');
            removeChannelButton.onclick = () => {
                removeChannel(channel._id);
            }

            // Edit channel
            const editChannelButton = tr.querySelector('.edit-button');
            editChannelButton.onclick = () => {
                editChannel(channel);
            }

            // Show streams info
            tr.onclick = (e) => {
                if(e.target.nodeName === 'BUTTON') return false;
                const nextTr = tr.nextElementSibling;
                if(nextTr.style.display === 'none'){
                    nextTr.style.display = 'table-row';
                }else{
                    nextTr.style.display = 'none';
                }
            }

            hideTr = document.createElement('tr');
            hideTr.style.display = 'none';
            hideTr.innerHTML = `<td colspan="4"">
                                    <table class="channel__stream-table">
                                        <tr class="channel__stream-header">
                                            <td>Название</td>
                                            <td>Дата добавления</td>
                                            <td>Действие</td>
                                        </tr>
                                     </table>
                                </td>`;
            table.appendChild(tr);
            table.appendChild(hideTr);
            // Create streams table
            const streamTable = hideTr.querySelector('table');
            channel.streams.forEach(stream => {
                const tr = document.createElement('tr');
                const el = `<td>${stream.name}</td>
                            <td>${new Date(stream.addDate).toLocaleDateString()}</td>
                            <td><button class="delete-button">Удалить</button></td>`;
                tr.innerHTML = el;
                streamTable.appendChild(tr);

                // Remove stream
                const removeStreamButton = tr.querySelector('.delete-button');
                removeStreamButton.onclick = () => {
                    removeStream(channel._id, stream._id);
                }
            });
            // Add new stream block
            const addTr = document.createElement('tr');
            addTr.classList.add('stream__add-block');
            addTr.dataset.id = channel._id;

            const el = `<td colspan="2"><input type="text" placeholder="Название потока"></td>
                        <td><button class="add-button">Добавить</button></td>`;

            addTr.innerHTML = el;
            streamTable.appendChild(addTr);

            // Add new stream button
            const addStreamButton = addTr.querySelector('.add-button');
            addStreamButton.onclick = () => {
                const name = addTr.querySelector('input').value.trim();
                const id = addTr.dataset.id;
                addStream(name, id);
            }
        });
    }
}