window.onload = () => {
    getUserInfo(0);
}

function getUserInfo(page){
    fetch(`/users/list?page=${page}`, {
        method: 'GET'
    })
        .then(response => response.json())
        .then(data => {
            renderUser(data);
        })
}

function addUser(name, role, company){
    const data = { name: name, role: role, company: company };
    fetch('/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            location.reload();
        })
}

function removeUser(id){
    fetch('/users', {
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

function renderUser(data){
    const table = document.querySelector('#user__table > tbody');

    if(data.length === 0){
        const tr = `<tr><td colspan="4" class="channel__not">Пользователи не обнаружены!</td></tr>`;
        table.innerHTML += tr;
    }else{
        data = data.data;
        console.log(data);
        data.forEach(user => {
            const tr = document.createElement('tr');
            const el = `<td>${user.name}</td>
                        <td>${user.role}</td>
                        <td>${user.company}</td>
                        <td><button class="delete-button">Удалить</button></td>`;
            tr.innerHTML = el;
            table.appendChild(tr);

            // Remove user
            const removeUserButton = tr.querySelector('.delete-button');
            removeUserButton.onclick = () => {
                const id = user._id;
                console.log(id);
                removeUser(id);
            }
        });
        const tr = document.createElement('tr');
        const el = `<td><input type="text" class="user__add-name" placeholder="Логин"></td>
                    <td><select class="user__add-role"><option selected>user</option><option>admin</option></select></td>
                    <td><input type="text" class="user__add-company" placeholder="Компания"></td>
                    <td><button class="add-button">Добавить</button></td>`;
        tr.innerHTML = el;
        table.appendChild(tr);
        // Add new user
        const addUserButton = tr.querySelector('.add-button');
        addUserButton.onclick = () => {
            const name = tr.querySelector('.user__add-name').value.trim();
            const role = tr.querySelector('.user__add-role').value.trim();
            const company = tr.querySelector('.user__add-company').value.trim();
            addUser(name, role, company);
        }
    }
}