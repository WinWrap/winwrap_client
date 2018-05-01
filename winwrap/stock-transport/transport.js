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
            this.serverip_ = serverip;
            this.key_ = undefined;
            this.ids_ = '0';
            this.remote_ = undefined;
            this.longpollTimerId_ = null;
            this.longpollBusy_ = false; // not in LongPoll
            this.longpollFailure_ = null;
            let hash = window.location.hash;
            if (hash) {
                let match = hash.toLowerCase().match(/\/key=([0-9a-f\-]*)/);
                if (match !== undefined && match.length === 2) {
                    this.key_ = match[1];
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
            let url = 'http://' + this.serverip_ + '/winwrap/requests/';
            if (this.key_) {
                if (this.serverip_) {
                    url = 'http://' + this.serverip_ + '/winwrap/route/requests/' + this.key_ + '/';
                } else {
                    url = 'http://www.winwrap.com/web/webedit/requests.asp?key=' + this.key_ + '/';
                }
            }

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
                /*try {
                    let responses = await this._ReceiveResponsesAsync();
                    this.remote_.PushPendingResponses(responses);
                } catch (err) {
                    console.log('Transport._LongPollAsync error: ' + err);
                }*/
                let error = null;
                try {
                    let responses = await this._ReceiveResponsesAsync();
                    this.remote_.PushPendingResponses(responses);
                } catch (err) {
                    error = err;
                } finally {
                    if (error) {
                        console.log('Transport._LongPollAsync error: ' + error);
                        let now = (new Date()).getTime();
                        if (this.longpollFailure_ === null) {
                            this.longpollFailure_ = now;
                        }
                        let timesecs = (now - this.longpollFailure_) / 1000;
                        if (timesecs >= 60) {
                            console.log(`Transport._LongPollAsync error for ${timesecs} seconds`);
                            // statusbar message
                            // shut off polling (like !detach)
                        }
                    } else {
                        this.longpollFailue_ = null;
                    }
                }
            }
        }

        async _ReceiveResponsesAsync() {
            let url = 'http://' + this.serverip_ + '/winwrap/responses/' + this.ids_;
            if (this.key_) {
                if (this.serverip_) {
                    url = 'http://' + this.serverip_ + '/winwrap/route/responses/' + this.key_ + '/' + this.ids_;
                } else {
                    url = 'http://www.winwrap.com/web/webedit/responses.asp?key=' + this.key_ + '&ids=' + this.ids_;
                }
            }

            return await this._SendAsync(url, '');
        }

        _SendAsync(url, requests) {
            let json = JSON.stringify(requests);
            let options = {
                type: 'POST',
                url: url,
                dataType: 'text',
                data: json,
                contentType: 'application/winwrap; charset=utf-8',
                beforeSend: jqXHR => {
                    // set request headers here rather than in the ajax 'headers' object
                    jqXHR.setRequestHeader('Accept', 'application/winwrap');
                },
                dataFilter: data => {
                    return data != '' ? JSON.parse(data) : [];
                }
            };
            return new Promise((resolve, reject) => {
                $.ajax(options).done(resolve).fail(reject);
            });
        }

        _Wait(ms) {
            return new Promise(r => setTimeout(r, ms));
        }
    }

    ww.Transport = Transport;

});
