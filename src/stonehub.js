// ==UserScript==
// @name         Stonehub
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  small improvements for idlescape's marketplace
// @author       weld
// @match        https://idlescape.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==


// setInterval(() => {
//     sockets[0].send('42["send message",{"channel_id":116,"channel_name":"1825","message":"si vous recevez ce message cest que ça marche lol","type":"channel"}]');
// }, 5000);

// let updateLoop = () => {
//         let marketplace_buy_info = document.getElementsByClassName('marketplace-buy-info')[0];
        
//         // remove the runecrafting alert
//         marketplace_buy_info.removeChild(document.getElementsByClassName('runecrafting-info')[0]);

//         // add 'Orders' button
//         let order_button = document.createElement('button');
//         order_button.className = 'marketplace-back-button';
//         order_button.innerHTML = 'Orders';
//         marketplace_buy_info.insertBefore(order_button, document.getElementById('marketplace-refresh-button'));
//         //marketplace_buy_info.insertAdjacentHTML('beforeend', '<button class="marketplace-back-button">Orders</button>');
// };

// setInterval(updateLoop, 1000);


// TODO LIST 
// : FAIRE LA DOC

class Stonehub {

    constructor() {
        // the dict stores all the corresponding msg / method to execute the action
        this.message_to_action = {
            "get market manifest":this.add_order_tab_action,
        }; 
    }

    add_order_tab_action() {
        // A REVOIR 
        let marketplace_buy_info = document.getElementsByClassName('marketplace-buy-info')[0];
        
        // remove the runecrafting alert
        marketplace_buy_info.removeChild(document.getElementsByClassName('runecrafting-info')[0]);

        // add 'Orders' button
        let order_button = document.createElement('button');
        order_button.className = 'marketplace-back-button';
        order_button.innerHTML = 'Orders';
        marketplace_buy_info.insertBefore(order_button, document.getElementById('marketplace-refresh-button'));

    }

    message_handler(e, that) {
        let msg = e.data;
        msg = (msg.match(/^[0-9]+(\[.+)$/) || [])[1];
        if(msg != null){
            let msg_parsed = JSON.parse(msg);
            let [r, data] = msg_parsed;

            // if the msg is stored in message_to_action, execute the function
            if(r in that.message_to_action) that.message_to_action[r]();
        }
    }

    start() {
        /* src: https://stackoverflow.com/questions/59915987/get-active-websockets-of-a-website-possible */
        /* Handle the current running socket */
        const sockets = [];
        const nativeWebSocket = window.WebSocket;
        window.WebSocket = function(...args){
            const socket = new nativeWebSocket(...args);
            sockets.push(socket);
            return socket;
        };
    
        // better idea than timeout? "(sockets != null || timeout(100))"
        // keeping the track of this, since changing the scope of the function modify it.
        setTimeout(() => {
            var that = this;
            sockets[0].addEventListener('message', (e) => this.message_handler(e, that));
        }, 2000);

    } 
}

let sh = new Stonehub(); sh.start();



