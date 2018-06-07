//FILE: remote.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class Remote { // singleton, but created in startup sequence

        // xxx es6 named paramaters not available Edge 41.16299.15.0
        // https://medium.com/dailyjs/named-and-optional-arguments-in-javascript-using-es6-destructuring-292a683d5b4e
        constructor(basic, name, transport) {
            this.Basic = basic;
            this.Name = name;
            this.transport_ = transport;
            this.channels_ = {};
            this.commitcounter_ = 0;
            this.refreshcounter_ = 0;
            this.polling_ = false; // not waiting to poll
            this.pollTimerId_ = null;
            this.pollBusy_ = false; // not in Poll
            this.pendingRequests_ = [];
            this.pendingResponses_ = [];
            this.expected_ = { gen: 0, response: '' };
            this.expectedResponse_ = null;
        }

        async InitializeAsync() {
            let channels = this._Channels();
            if (!channels.length) {
                return;
            }
            // initialize transport
            await this.transport_.InitializeAsync(this);
            // initialize channels
            for (let channel of channels) {
                await channel.InitializeAsync();
                //console.log(`Remote.InitializeAsync channel.Name = ${channel.Name}`);
            }
            // set the channel ids
            this._SetTransportIds();
            // start polling timer
            this.pollTimerId_ = setInterval(async () => {
                await this._PollAsync();
            }, 100); // waiting to poll
            this.polling_ = true;
        }

        AddChannel(channel) {
            this.channels_[channel.Name] = channel;
        }

        ChannelById(id) {
            return this._Channels().filter(channel => channel.AllocatedID === id)[0];
        }

        ChannelByName(name) {
            return this.channels_[name];
        }

        DetachChannel(channel) {
            delete this.channels_[channel.Name];
            this._SetTransportIds();
        }

        PollBusy() {
            return this.pollBusy_;
        }

        PushPendingRequest(request) {
            this.pendingRequests_.push(request);
        }

        PushPendingResponses(responses) {
            responses.forEach(response => {
                response.datetimeClient = new Date().toLocaleString();
                if (response.gen === this.expected_.gen && response.response === this.expected_.response) {
                    this.expectedResponse_ = response;
                } else {
                    this.pendingResponses_.push(response);
                }
            });
        }

        async SendRequestAndGetResponseAsync(request) {
            this.expected_ = { gen: request.gen, response: '!' + request.request.substring(1) };
            let requests = this.pendingRequests_;
            this.pendingRequests_ = [];
            requests.push(request);
            console.log('Remote.SendRequestAndGetResponseAsync>>> ' + this._ValueMsg(requests, 'request'));
            try {
                await this._SendRequestsAsync(requests);
            } catch(err) {
                console.log('Remote.SendRequestAndGetResponseAsync error: ' + err);
                let pollErrMsg = `${this.Name} send error at ${new Date().toLocaleString()}`;
                this.SetStatusBarText(pollErrMsg);
                return [];
            }

            // retrys may not be necessary - haven't seen
            let start = new Date().getTime();
            let end = start;
            let response = null;
            for (var trys = 1; response === null && trys < 20; trys++) {
                await this._Wait(50);
                end = new Date().getTime();
                response = this.expectedResponse_;
                this.expectedResponse_ = null;
            }
            console.log('Remote.SendRequestAndGetResponseAsync<<< ' + this._ValueMsg([response], 'response'));
            console.log({
                request: this._ValueMsg(request, 'request'),
                expected: this.expected_.response,
                results: this._ValueMsg(response, 'response'),
                trys: trys,
                elapsedms: end - start
            });
            this.expected_ = { gen: 0, response: '' };
            return response;
        }

        SetStatusBarText(text) {
            this._Channels().forEach(channel => channel.SetStatusBarText(text));
        }

        StartPolling() {
            this.polling_ = true; // waiting to poll
        }

        StopPolling() { // stop during autocomplete and signaturehelp
            this.polling_ = false; // not waiting to poll
        }

        _Channels() {
            return Object.values(this.channels_);
        }

        async _PollAsync() {
            if (this.polling_ && !this.pollBusy_ && this.transport_.Attached()) {
                this.pollBusy_ = true;
                if (++this.refreshcounter_ === 600) {
                    // refresh approx once every 60 seconds
                    this._Channels().forEach(channel => {
                        channel.PushPendingRequest({ command: 'refresh', target: channel.CommitRebase.Name() });
                    });
                    this.refreshcounter_ = 0;
                }
                if (++this.commitcounter_ === 20) {
                    // push any pending commits (approx once every 2 seconds)
                    this._Channels().forEach(channel => channel.PushPendingCommit());
                    this.commitcounter_ = 0;
                }
                if (this.pendingRequests_.length > 0) {
                    // send pending requests
                    let requests = this.pendingRequests_;
                    this.pendingRequests_ = [];
                    await this._SendRequestsAsync(requests);
                }
                if (this.pendingResponses_.length > 0) {
                    // process pending responses
                    let responses = this.pendingResponses_;
                    this.pendingResponses_ = [];
                    responses.forEach(response => {
                        if (response.id === -1) {
                            this._Channels().forEach(channel => channel.ProcessResponse(response));
                        } else {
                            let channel = this.ChannelById(response.id);
                            if (channel !== undefined) {
                                channel.ProcessResponse(response);
                            }
                        }
                    });
                }
                this.pollBusy_ = false;
            }
        }

        async _SendRequestsAsync(requests) {
            if (requests.length > 0) {
                try {
                    await this.transport_.SendRequestsAsync(requests);
                } catch (err) {
                    console.log('Remote._SendRequestsAsync error: ' + err);
                    let pollErrMsg = `${this.Name} send error at ${new Date().toLocaleString()}`;
                    this.SetStatusBarText(pollErrMsg);
                }
            }
        }

        _SetTransportIds() {
            let ids = this._Channels().map(channel => channel.AllocatedID);
            this.transport_.SetIds(ids);
        }

        _Wait(ms) {
            return new Promise(r => setTimeout(r, ms));
        }

        _ValueMsg(data, key) {
            let xdata = [].concat(data).filter(item => item !== null && item !== undefined);
            let datas = xdata.map(o => o[key]);
            return datas.toString();
        }
    }

    ww.Remote = Remote;

});
