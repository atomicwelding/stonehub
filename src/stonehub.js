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

// todo : mieux gérer les flags, bug queue, ajouter gestion d'erreur

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
            "get player marketplace items":this.convenients_marketplace_items_action,
            "get player auctions":this.convenients_sell_item_action
        };

        // some macros
        this.socket_latency     = 1000;
        this.auto_refresh_time  = 1000;
        
        this.sockets = [];

        /**
         * Simple flag system to limit the number of requests used
         * It may be improved later.
         */
        this.flags = {
            "watchingItem":false,
            "watchingAuction":false
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

        // // ==== STATUS ==== //
        // let menu_button = document.getElementsByClassName('navbar1')[0].children[0];
        // menu_button.innerHTML = 'bug'
        // menu_button.addEventListener('click', () => {

        //     alert('ahi');
        //     // let navbar = document.getElementsByClassName('nav-drawer-container');
        
        //     // let stonehub_status = document.createElement('div');
        //     // stonehub_status.innerHTML = 'Stonehub is online';
        //     // stonehub_status.className = 'drawer-item noselect';
        //     // navbar.insertBefore(stonehub_status, navbar.children[2]);

        // });
        
        /* src: https://stackoverflow.com/questions/59915987/get-active-websockets-of-a-website-possible */
        /* Handle the current running socket */
        const nativeWebSocket = window.WebSocket;
        window.WebSocket = function(...args){
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

    } 
}

Stonehub.prototype.add_order_tab_action = function(that) {
    /**
     * The method add an order tab to the main page of the marketplace. But the whole function should be seen as the place
     * to manage the marketplace and not just for the order tab. Please rename the function
     */
    
    // since you're watching the whole market, deactivate the other flags
    that.flags.watchingItem = false;
    that.flags.watchingAuction = false;
    
    // ==== ORDER BUTTON ==== //
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
     *  BUG : 
     *      queueing is not working since the method is called at each request emitted here
     *      so we're hard spamming request and the timeout doesn't help
     */

    // since you're watching the page, make the flag up and deactivate others
    that.flags.watchingItem = true;
    that.flags.watchingAuction = false;
    
    // ==== AUTOREFRESH ==== //
    // not very clean
    let clr = setTimeout(() => {
        // we use the flags here to limit the number of requests, server load.
        if(that.flags.watchingItem){
            that.sockets[0].send('42["get player marketplace items",'+data[0].itemID+']');
        }
        else
            clearTimeout(clr);           
    }, that.auto_refresh_time);
}

Stonehub.prototype.show_popup_sell_item = function(that, data, id) {

    // GEO, CEST ICI QUE CA SE PASSE

    /**
     * This method implements a resell feature
     * Shows when you click on stone button
     */
    modify_auction_popup_html = `<div role="presentation" class="MuiDialog-root sell-item-dialog" style="position: fixed; z-index: 1300; right: 0px; bottom: 0px; top: 0px; left: 0px;">
                                    <div class="MuiBackdrop-root" aria-hidden="true" style="opacity: 1; transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;"></div>
                                    <div tabindex="0" data-test="sentinelStart"></div>
                                    <div class="MuiDialog-container MuiDialog-scrollPaper" role="none presentation" tabindex="-1" style="opacity: 1; transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;">
                                    <div class="MuiPaper-root MuiDialog-paper MuiDialog-paperScrollPaper MuiDialog-paperWidthSm MuiPaper-elevation24 MuiPaper-rounded" role="dialog">
                                        <div class="MuiDialogTitle-root">
                                            <h5 class="MuiTypography-root MuiTypography-h6">Modify Auction</h5>
                                        </div>
                                        <div class="MuiDialogContent-root">
                                            <p class="MuiTypography-root MuiDialogContentText-root MuiTypography-body1 MuiTypography-colorTextSecondary">How many do you want to sell?</p>
                                            <div class="MuiGrid-root item-input MuiGrid-container MuiGrid-spacing-xs-2 MuiGrid-align-items-xs-center">
                                                <div class="MuiGrid-root item-input-slider MuiGrid-item MuiGrid-grid-xs-true"><span class="MuiSlider-root MuiSlider-colorPrimary"><span class="MuiSlider-rail"></span><span class="MuiSlider-track" style="left: 0%; width: 0%;"></span><input type="hidden" value="1"><span class="MuiSlider-thumb MuiSlider-thumbColorPrimary" tabindex="0" role="slider" data-index="0" aria-labelledby="continuous-slider" aria-orientation="horizontal" aria-valuemax="2268" aria-valuemin="1" aria-valuenow="1" style="left: 0%;"></span></span></div>
                                                <div class="MuiGrid-root MuiGrid-item">
                                                <div id='amount' class="MuiInputBase-root MuiInput-root MuiInput-underline item-input-text MuiInputBase-marginDense MuiInput-marginDense"><input type="number" step="1" min="1" max="2268" aria-labelledby="input-slider" class="MuiInputBase-input MuiInput-input MuiInputBase-inputMarginDense MuiInput-inputMarginDense" value="1"></div>
                                                </div>
                                            </div>
                                            <div variant="contained" color="secondary" class="item-dialogue-button idlescape-button idlescape-button-green">Sell Max</div>
                                            <p class="MuiTypography-root MuiDialogContentText-root MuiTypography-body1 MuiTypography-colorTextSecondary">Price per item you wish to sell<br><span id="lowest-price">Current lowest price on market: 178 <img src="/images/gold_coin.png" alt="Gold coins" class="icon10"></span></p>
                                            <p class="MuiTypography-root MuiDialogContentText-root MuiTypography-body1 MuiTypography-colorTextSecondary"><span id="lowest-price"> This item sells to NPCs for: 100 <img src="/images/gold_coin.png" alt="Gold coins" class="icon10"></span></p>
                                            <input id="price" type="text" value="0">
                                            <p class="MuiTypography-root MuiDialogContentText-root MuiTypography-body1 MuiTypography-colorTextSecondary">You will receive: 0 <img src="/images/gold_coin.png" alt="" class="icon16"> <br>After the fee of : 0 <img src="/images/gold_coin.png" alt="" class="icon16"></p>
                                        </div>
                                        <div class="MuiDialogActions-root MuiDialogActions-spacing">
                                            <div id='close_button' variant="contained" color="secondary" class="item-dialogue-button idlescape-button idlescape-button-red">Close</div>
                                            <div id='sell_button' variant="contained" color="secondary" class="item-dialogue-button idlescape-button idlescape-button-green">Sell</div>
                                        </div>
                                    </div>
                                    </div>
                                    <div tabindex="0" data-test="sentinelEnd"></div>
                                </div>` ;

    let modify_auction_popup = document.createElement('div');
    modify_auction_popup.id  = 'modify_auction_popup';
    modify_auction_popup.innerHTML = modify_auction_popup_html;

    let body = document.getElementsByTagName('body')[0];
    body.appendChild(modify_auction_popup);

    // pairing features to buttons
    // i used e.target instead of adding a listener to each buttons to limit code duplication
    document.addEventListener('click', e => {
        switch(e.target) {
            case document.getElementById('close_button'):
                document.getElementById('modify_auction_popup').outerHTML = '';
            break;
            case document.getElementById('sell_button'):
                // cancel auction
                // that.sockets[0].send('42["cancel my auction",'+id+']');

                // make a new auction
                let amount = document.getElementById('amount').value;
                let price  = document.getElementById('price').getAttribute('value');
                
                console.log(data);
                // console.log('42["cancel my auction",'+id+']');
                // console.log('42["sell item marketplace",{"amount":'+amount+',"price":'+price+',"dbID":'+id+'}]');

                console.log('42["sell item marketplace",{"amount":'+2+',"price":'+111000+',"dbID":'+id+'}]');
                that.sockets[0].send('42["sell item marketplace",{"amount":'+2+',"price":'+111000+',"dbID":'+id+'}]');

                // close popup
                document.getElementById('modify_auction_popup').outerHTML = '';
            break;
        }
    });
}

Stonehub.prototype.convenients_sell_item_action = function(that, data) {
    /**
     * This method add some convenients and small adjustements to the sell page.
     * Current features : 
     *      Button added for further features
     *      Autorefresh when someone bought the item
     */
    // since you're watching the page, make the flag up and deactivate others
    that.flags.watchingAuction = true;
    that.flags.watchingItem = false;

    // console.log(data);

    // ==== AUTOREFRESH ==== //
    let clr = setTimeout(() => {
        // we use the flags here to limit the number of requests, server load.
        if(that.flags.watchingAuction){
            that.sockets[0].send('42["get player auctions",[]]');
        }
        else
            clearTimeout(clr);           
    }, that.auto_refresh_time);


    // ==== STONE BUTTON ==== //
    let auction_table_tbody = document.getElementsByClassName('marketplace-my-auctions')[0].getElementsByTagName('tr');
    let auction_table_tbody_ar= Array.prototype.slice.call(auction_table_tbody);
    auction_table_tbody_ar.shift();
    
    // for each auction in the table
    auction_table_tbody_ar.forEach((element, index) => {
        // check if button doesn't already exist
        if(element.getElementsByClassName('modify_auction_button').length == 0) {

            // add button
            let modify_auction_button = document.createElement('td');
            modify_auction_button.className = 'modify_auction_button';
            modify_auction_button.id = data[index].id;

            console.log(index+': '+data[index].id);

            // add the image
            let modify_auction_img    = document.createElement('img');
            modify_auction_img.src    = 'https://idlescape.com/images/mining/stone.png';
            modify_auction_button.appendChild(modify_auction_img);

            // listener, popup
            modify_auction_button.addEventListener('click', () => {
                that.show_popup_sell_item(that, data, data[index].id);
            });
            element.appendChild(modify_auction_button);
        }
    });
}

// ==== MAIN ==== //

try {
    let sh = new Stonehub(); sh.start();
} catch (e) {
    console.log(e)
}




