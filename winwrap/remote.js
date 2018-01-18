define(function () {

    class Remote { // singleton, but created in startup sequence
        // xxx es6 named paramaters not available Edge 41.16299.15.0
        // https://medium.com/dailyjs/named-and-optional-arguments-in-javascript-using-es6-destructuring-292a683d5b4e
        constructor(basic, name, serverip) {
            this.Basic = basic;
            this.Name = name;
            this.serverip_ = serverip;
            this.channels_ = {};
            this.pollingIndex_ = -1;
            this.polling_ = false; // not waiting to poll
            this.timerId_ = null;
            this.pollBusy_ = false; // not in Poll
            this.pendingRequests = [];
        }
        AddChannel(channel) {
            this.channels_[channel.Name] = channel;
        }
        Channel(name) {
            return this.channels_[name];
        }
        ChannelById(id) {
            return Object.values(this.channels_).filter(channel => channel.AllocatedID === id)[0];
        }
        async Initialize() {
            Object.values(this.channels_).forEach(async function (channel) {
                await channel.Initialize();
            });
            this.StartPolling();
        }
        PollBusy() {
            return this.pollBusy_;
        }
        StartPolling() { // stop during autocomplete and signaturehelp
            if (!this.polling_) {
                this.polling_ = true; // waiting to poll
                if (this.timerId_ == null) {
                    let remote = this; // closure can't handle this in the lambdas below
                    this.timerId_ = setTimeout(async () => {
                        await remote._Poll();
                    }, 100); // waiting to poll
                }
            }
        }
        StopPolling() {
            this.polling_ = false; // not waiting to poll
            if (this.timerId_ != null) {
                clearTimeout(this.timerId_);
                this.timerId_ = null;
            }
        }
        PushPendingRequest(request) {
            this.pendingRequests.push(request);
        }
        Process(responses, id) {
            responses.forEach(response => {
                response.datetimeClient = new Date().toLocaleString();
                let channel = this.ChannelById(id);
                if (channel !== undefined) {
                    channel.UI.Process(response);
                }
            });
        }
        async SendAsync(request, expected, id) {
            let requests = this._ExtractPendingRequestsForId(id);
            requests.push(request);
            console.log('Remote.SendAsync(' + id + ')>>> ' + this._valuesmsg(requests, 'command'));
            let response = null;
            let responses = [];
            let start = new Date().getTime();
            let end = start;
            for (var trys = 1; trys < 10; trys++) { // xxx
                let tryresponses = await this._Send(trys === 1 ? requests : [], id);
                end = new Date().getTime();
                tryresponses.forEach(tryresponse => {
                    if (tryresponse.response === expected) {
                        response = tryresponse;
                    } else {
                        responses.push(tryresponse);
                    }
                });
                if (response != null) {
                    break;
                }
                await this._Wait(100);
            }
            console.log('Remote.SendAsync(' + id + ')<<< ' + this._valuesmsg(responses.concat(response), 'response'));
            this.Process(responses, id);
            console.log({
                request: this._valuesmsg(requests, 'command'),
                expected: expected.toString(),
                results: this._valuesmsg(response, 'response'),
                trys: trys,
                elapsedms: end-start
            });
            return response;
        }
        async _Poll() {
            if (!this.polling_ || this.pollBusy_) {
                return;
            }
            this.pollBusy_ = true;
            this.StopPolling(); // not waiting to poll
            Object.values(this.channels_).forEach(channel => channel.Poll());
            let id = 0;
            let requests = [];
            if (this.pendingRequests.length > 0) {
                id = this.pendingRequests[0].id;
                requests = this._ExtractPendingRequestsForId(id);
                console.log('Remote.Poll(' + id + ')>>> ' + this._valuesmsg(requests, 'command'));
            } else {
                let channels = Object.values(this.channels_);
                if (++this.pollingIndex_ >= channels.length)
                    this.pollingIndex_ = 0;
                id = this.pollingIndex_ < channels.length ? channels[this.pollingIndex_].AllocatedID : 0;
            }
            let responses = [];
            try {
                responses = await this._Send(requests, id);
            } catch (err) {
                console.log('Remote.Poll(' + id + ') error: ' + err);
            }
            if (responses.length > 0) {
                console.log('Remote.Poll(' + id + ')<<< ' + this._valuesmsg(responses, 'response'));
                this.Process(responses, id);
            }
            this.pollBusy_ = false;
            this.StartPolling(); // waiting to poll
        }
        _Send(requests, id) { // called by Poll and SendAsync
            let url = 'http://' + this.serverip_ + '/winwrap/poll/' + id;
            let json = JSON.stringify(requests);
            let options = {
                type: 'POST',
                url: url,
                dataType: 'text',
                data: json,
                contentType: 'application/winwrap; charset=utf-8',
                beforeSend: function (jqXHR) {
                    // set request headers here rather than in the ajax 'headers' object
                    jqXHR.setRequestHeader('Accept', 'application/winwrap');
                },
                dataFilter: data => {
                    return JSON.parse(data);
                }
            };
            return new Promise(function (resolve, reject) {
                $.ajax(options).done(resolve).fail(reject);
            });
        }
        _Wait(ms) {
            return new Promise(r => setTimeout(r, ms));
        }
        _ExtractPendingRequestsForId(id) {
            let pendingRequests = this.pendingRequests;
            this.pendingRequests = [];
            let requests = [];
            pendingRequests.forEach(request => {
                if (request.id === id) {
                    requests.push(request);
                } else {
                    this.pendingRequests.push(request);
                }
            });
            return requests;
        }
        _valuesmsg(data, key) {
            let xdata = [].concat(data).filter(item => item !== null && item !== undefined);
            let datas = xdata.map(o => o[key]);
            return datas.toString();
        }
    }

    ww.Remote = Remote;

});
