define(function () {

    class AjaxPrototype { // singleton, but created in startup sequence
        // xxx es6 named paramaters not available Edge 41.16299.15.0
        // https://medium.com/dailyjs/named-and-optional-arguments-in-javascript-using-es6-destructuring-292a683d5b4e
        constructor() {
            this.Tid = null; // not waiting to poll
            this.needstatus = false;
            this.pendingRequests = [];
        }
        StartPolling() { // stop during autocomplete and signaturehelp
            if (this.Tid == null) {
                this.Tid = setTimeout(this.Pollfn, 100); // waiting to poll
            }
        }
        StopPolling() {
            if (this.Tid != null) {
                clearTimeout(this.Tid);
                this.Tid = null; // not waiting to poll
            }
        }
        Pollfn() {
            ww.Ajax.Poll();
        }
        Poll() {
            // set this for the singleton
            this.Tid = null; // not waiting to poll
            var requests = this.pendingRequests;
            if (requests.length > 0) {
                this.pendingRequests = [];
                console.log("Ajax.Send>>> " + this.valuesmsg(requests, "command"));
            }
            return this.Send(requests).then(responses => {
                if (responses.length > 0) {
                    console.log("Ajax.Send<<< " + this.valuesmsg(responses, "response"));
                    ww.ResponseHandlers.Dispatch(responses);
                }
                this.StartPolling();
            });
        }
        PushPendingRequest(request) {
            if (request) {
                this.pendingRequests.push(request);
            }
        }
        Send(requests) { // called by Poll and SendAsync
            requests = requests.map(item => {
                item.datetime = new Date().toLocaleString();
                item.id = ww.Attach.AllocatedID;
                item.gen = ww.Attach.Generation();
                return item;
            });
            let url = ww.Attach.API + "poll/" + ww.Attach.AllocatedID;
            let json = JSON.stringify(requests);
            let options = {
                type: "POST",
                url: url,
                dataType: 'text',
                data: json,
                contentType: "application/winwrap; charset=utf-8",
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
        async SendAsync(request, expected) {
            let requests = this.pendingRequests;
            this.pendingRequests = [];
            requests.push(request);
            console.log("Ajax.SendAsync>>> " + this.valuesmsg(requests, "command"));
            let response = null;
            let responses = [];
            let start = new Date().getTime();
            let end = start;
            for (var trys = 1; trys < 10; trys++) { // xxx
                let tryresponses = await this.Send(trys === 1 ? requests : []);
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
                await this.Wait(100);
            }
            console.log("Ajax.SendAsync<<< " + this.valuesmsg(responses.concat(response), "response"));
            ww.ResponseHandlers.Dispatch(responses);
            console.log({
                request: this.valuesmsg(requests, "command"),
                expected: expected.toString(),
                results: this.valuesmsg(response, "response"),
                trys: trys,
                elapsedms: end-start
            });
            return response;
        }
        Wait(ms) {
            return new Promise(r => setTimeout(r, ms));
        }
        valuesmsg(data, key) {
            let xdata = [].concat(data).filter(item => {
                return item !== null && item !== undefined;
            });
            let datas = xdata.map(o => o[key]);
            return datas.toString();
        }
    }

    ww.AjaxPrototype = AjaxPrototype;

});
