var ww = ww || {};

(function () {

    class AjaxPost { // new this class for each use // xxx prototype?
        constructor() { }
        Post(url, obj) { // xxx what if obj is null ?
            let json = JSON.stringify(obj);
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
        Send(request) {
            let requests = [].concat(request).filter(x => x);
            requests = requests.map(item => {
                item.datetime = new Date().toLocaleString();
                item.id = ww.Attach.AllocatedID;
                item.gen = ww.Attach.Generation();
                return item;
            });
            let url = ww.Attach.API + "poll/" + ww.Attach.AllocatedID;
            //let url = "http://localhost:5000/winwrap/poll/" + ww.Attach.AllocatedID;
            return this.Post(url, requests);
        }
        async SendAsync(requests, expected) {
            let results = [];
            let start = new Date().getTime();
            for (var trys = 1; trys < 10; trys++) { // xxx
                let result = await this.Send(trys === 1 ? requests : undefined);
                var elapsed = new Date().getTime() - start;
                results.push(...result);
                if (this.isallresults(results, expected)) {
                    break;
                }
                await this.Wait(25);
            }
            console.log({
                request: this.valuesmsg(requests, "command"),
                expected: expected.toString(),
                results: this.valuesmsg(results, "response"),
                trys: trys,
                elapsedms: elapsed
            });
            return results;
        }
        valuesmsg(data, key) {
            let xdata = [].concat(data).filter(item => {
                return item !== null && item !== undefined;
            });
            let datas = xdata.map(o => o[key]);
            return datas.toString();
        }
        isallresults(result, expected) {
            if (result.length === undefined) { // an array with a null entry xxx
                return false;
            }
            let found = expected.filter(item => {
                let response = result.find(o => o.response === item);
                return response !== undefined;
            });
            return found.length >= expected.length;
        }
        Wait(ms) {
            return new Promise(r => setTimeout(r, ms));
        }
    }

    ww.AjaxPost = AjaxPost;

    class AjaxPrototype { // singleton, but created in startup sequence
        // xxx es6 named paramaters not available Edge 41.16299.15.0
        // https://medium.com/dailyjs/named-and-optional-arguments-in-javascript-using-es6-destructuring-292a683d5b4e
        constructor({ enablepolling = true } = { enablepolling: true }) {
            this.enablepolling = enablepolling;
            this.Tid = undefined; // int inuse, null suspended
            this.needstatus = false;
            this.pendingRequests = [];
        }
        StartPolling() { // stop during autocomplete and signaturehelp
            if (this.enablepolling) {
                this.Tid = setInterval(this.Pollfn, 250);
            }
        }
        StopPolling() {
            if (this.Tid !== null) {
                clearInterval(this.Tid);
                this.Tid = null;
            }
        }
        Pollfn() {
            ww.Ajax.Pollfn_();
        }
        Pollfn_() {
            // set this for the singleton
            var requests = this.pendingRequests;
            if (requests.length > 0)
                this.pendingRequests = [];

            ww.Ajax.SendProcess(requests, false);
        }
        SendProcess(request = [], pollaftersend = true) {
            return new ww.AjaxPost().Send(request).then(notifications => {
                if (notifications.length >= 1) { // xxx start polling here ?
                    ww.Ajax.ProcessNotifications(notifications);
                }
                if (pollaftersend && !this.enablepolling) {
                    //setTimeout(this.Pollfn, 100);
                    //setTimeout(this.Pollfn, 500);
                }
            });
            //return result; // xxx
        }
        ProcessNotifications(notifications) { // in this singleton by convenience
            notifications.forEach(notification => {
                if (notification.id === -1) {
                    if (notification.response === "!new") { // xxx id -1
                        ww.Responses.Process(notification);
                    }
                    if (notification.response === "!attach") {
                        return; // ignored
                    }
                    ww.Notifications.Process(notification);
                } else {
                    ww.Responses.Process(notification);
                }
            });
        }
        PushPendingRequest(request) {
            this.pendingRequests.push(request);
        }
    }

    ww.AjaxPrototype = AjaxPrototype;

})();
