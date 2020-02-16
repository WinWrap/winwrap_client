//FILE: transport.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class Transport {

        constructor(serverip) {
            this.serverip_ = serverip ? serverip : 'webedit.winwrap.com';
            this.key_ = undefined;
            this.ids_ = '0';
            this.remote_ = undefined;
            this.longpollTimerId_ = null;
            this.longpollBusy_ = false; // not in LongPoll
            this.longpollFailure_ = null;
            let hash = window.location.hash;
            if (hash) {
                let res = hash.toLowerCase().match(/\/key=([0-9a-f\-]*)/);
                if (Array.isArray(res) && res.length === 2) {
                    this.key_ = res[1];
                }
            }
        }

        Attached() {
            return this.longpollBusy_;
        }

        async InitializeAsync(remote) {
            this.remote_ = remote;
            this.longpollTimerId_ = setTimeout(async () => {
                await this._LongPollAsync();
            }, 10);
            // wait for long poll to start
            while (!this.longpollBusy_) {
                await this._Wait(100);
            }
        }

        async SendRequestsAsync(requests) {
            let url = this.key_ === null ?
                'http://' + this.serverip_ + '/winwrap/requests/' :
                'http://' + this.serverip_ + '/winwrap/route/requests/' + this.key_ + '/';
            return await this._SendAsync(url, requests);
        }

        SetIds(ids) {
            this.ids_ = ids.join('-');
            if (ids.length === 0) {
                // detach
                this.longpollBusy_ = false;
            }
        }

        async _LongPollAsync() {
            this.longpollBusy_ = true;
            while (this.longpollBusy_) {
                try {
                    let responses = await this._ReceiveResponsesAsync();
                    this.remote_.PushPendingResponses(responses);
                    this.longpollFailure_ = null;
                } catch (err) {
                    console.log('Transport._LongPollAsync error:' + err.statusText);
                    console.log(err);
                    let now = (new Date()).getTime();
                    if (this.longpollFailure_ === null) {
                        this.longpollFailure_ = now;
                    }
                    let timesecs = (now - this.longpollFailure_) / 1000;
                    if (timesecs >= 60) {
                        let timeoutmsg = `Polling failed for ${timesecs} seconds. Try restarting client/server.`;
                        console.log(`Transport._LongPollAsync ${timeoutmsg}`);
                        this.remote_.SetStatusBarText(timeoutmsg);
                        this.remote_.PushPendingRequest({ command: 'detach' });
                        // detach won't get to server, so stop polling
                        this.remote_.StopPolling();
                        this.longpollBusy_ = false;
                    }
                    await this._Wait(1000);
                }
            }
        }

        async _ReceiveResponsesAsync() {
            let url = this.key_ === null ?
                'http://' + this.serverip_ + '/winwrap/responses/' + this.ids_ :
                'http://' + this.serverip_ + '/winwrap/route/responses/' + this.key_ + '/' + this.ids_;
            return await this._SendAsync(url, '');
        }

        async _SendAsync(url, requests) {
            let json = JSON.stringify(requests);
            let options = {
                type: 'POST',
                url: url,
                dataType: 'text',
                data: json,
                contentType: 'application/winwrap; charset=utf-8',
                timeout: 3000, //3 second timeout
                beforeSend: jqXHR => {
                    // set request headers here rather than in the ajax 'headers' object
                    jqXHR.setRequestHeader('Accept', 'application/winwrap');
                },
                dataFilter: data => {
                    return data !== '' ? JSON.parse(data) : [];
                }
            };
            return await $.ajax(options);
        }

        _Wait(ms) {
            return new Promise(r => setTimeout(r, ms));
        }
    }

    ww.Transport = Transport;

});
