(function () {
    'use strict';
    let args = window.location.toString().split('?')[1];
    const ws = new WebSocket('ws://192.168.2.111:7123/ws?' + args);

    ws.addEventListener('message', (evt) => {
        console.log('Message from server: ', evt.data);
    });
})();
