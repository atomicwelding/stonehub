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
            "get player marketplace items":this.convenients_marketplace_items_action
        };

        this.auto_refresh_time = 1000;
        this.sockets = [];
    }

    message_handler(that, e) {
        let msg = e.data;
        msg = (msg.match(/^[0-9]+(\[.+)$/) || [])[1];
        if(msg != null){
            let msg_parsed = JSON.parse(msg);
            let [r, data] = msg_parsed;

            // if the msg is stored in message_to_action, execute the function
            if(r in that.message_to_action) that.message_to_action[r](that, data);
        }
    }

    start() {
        // keeping the track of this, since changing the scope of the function modify it.
        var that = this;
        
        /* src: https://stackoverflow.com/questions/59915987/get-active-websockets-of-a-website-possible */
        /* Handle the current running socket */
        const nativeWebSocket = window.WebSocket;
        window.WebSocket = function(...args){
            console.log('ahi');
            const socket = new nativeWebSocket(...args);
            that.sockets.push(socket);
            return socket;
        };

        // better idea than timeout? "(sockets != null || timeout(100))"
        setTimeout(() => {
            this.sockets[0].addEventListener('message', (e) => this.message_handler(that, e));
        }, 1000);

    } 
}

Stonehub.prototype.add_order_tab_action = function(that) {
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

Stonehub.prototype.convenients_marketplace_items_action = function(that, data){
    setTimeout(() => {
        that.sockets[0].send('42["get player marketplace items",'+data[0].itemID+']');
    }, 2000)
}


// ==== MAIN ====/

let sh = new Stonehub(); sh.start();



