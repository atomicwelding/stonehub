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

class Stonehub {
    
    /**
     * Stonehub is a tampermonkey extension ; its purpose is to add some QoL on the marketplace.
     * This works by hooking the current running socket and make simple call to the server.
     */

    constructor() {
        
        /**
         * This dictionnary embed all the pair event-methods.
         * You can easily implement new corresponding methods by adding the event as the key, and a reference the right method. 
         */
        this.event_to_action = {
            "get market manifest":this.add_order_tab_action,
            "get player marketplace items":this.convenients_marketplace_items_action
        };

        // some macros
        this.socket_latency     = 1000;
        this.auto_refresh_time  = 1000;
        
        this.sockets = [];

        this.stonehub_version = "V1.0.0"

        /**
         * Simple flag system to limit the number of requests used
         * It may be improved later.
         */
        this.flags = {
            "watchingItem":false
        }
    }

    message_handler(that, e) {
        /**
         * Here is the message handler.
         * When a new websocket message is emitted from the server
         * the extension hooks it and call the desired methods.
         * Check out this.event_to_action.
         * 
         * All the methods are called with a reference to this/that and the datas the game threw.
         * Please keep at least a reference to that when creating a new method.
         */
        let msg = e.data;
        msg = (msg.match(/^[0-9]+(\[.+)$/) || [])[1];
        if(msg != null){
            let msg_parsed = JSON.parse(msg);
            let [r, data] = msg_parsed;

            // if the event is stored in event_to_action, execute the function
            if(r in that.event_to_action) that.event_to_action[r](that, data);
        }
    }

    start() {
        /**
         * Main part of the extension
         */

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
            /**
             * A listener is created to catch messages emitted by the server through the websocket.
             */
            this.sockets[0].addEventListener('message', (e) => this.message_handler(that, e));
        },  this.socket_latency);

        // add text next to the player counter
        setTimeout(() => {
            var usersOnlineDiv = document.getElementById("usersOnline");
            var spantext = document.createElement('span');
            spantext.setAttribute("style","color:#54FF9F;text-shadow: 1px 1px 10px #39c70d;background-image:url(https://static.cracked.to/images/bg1.gif);");
            spantext.appendChild(document.createTextNode(" | " + this.stonehub_version ));
            usersOnlineDiv.appendChild(spantext);
        },  this.socket_latency);

    } 
}

Stonehub.prototype.add_order_tab_action = function(that) {
    /**
     * The method add an order tab to the main page of the marketplace. But the whole function should be seen as the place
     * to manage the marketplace and not just for the order tab. Please rename the function
     */
    
    // since you're watching the whole market, deactivate the watchingItem flag
    that.flags.watchingItem = false;
    
    let marketplace_buy_info = document.getElementsByClassName('marketplace-buy-info')[0];
    
    // remove the runecrafting banner
    marketplace_buy_info.removeChild(document.getElementsByClassName('runecrafting-info')[0]);

    // add 'Orders' button
    let order_button = document.createElement('button');
    order_button.className = 'marketplace-back-button';
    order_button.innerHTML = 'Orders';
    order_button.title     = 'Not implemented yet';
    marketplace_buy_info.insertBefore(order_button, document.getElementById('marketplace-refresh-button'));

}

Stonehub.prototype.convenients_marketplace_items_action = function(that, data){
    /**
     * This method add some convenients and small adjustements to an item page.
     * Current features : 
     *      Autorefresh
     */

    // since you're watching the page, make the flag up
    that.flags.watchingItem = true;
    
    // not very clean but the feature intended here is autorefresh
    let clr = setTimeout(() => {
        // we use the flags here to limit the number of requests, server load.
        if(that.flags.watchingItem)
            that.sockets[0].send('42["get player marketplace items",'+data[0].itemID+']');
        else
            clearTimeout(clr);           
    }, this.auto_refresh_time)
}


// ==== MAIN ==== //
let sh = new Stonehub(); sh.start();



