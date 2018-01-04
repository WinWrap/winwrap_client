var ww = ww || {};

(function () {

    class Test000Prototype {
        constructor() {
            this.url = "http://192.168.1.203:5000/winwrap/";
            this.request = null;
        }
        Version() {
            this.url += "version";
            return ww.Ajax.Post(this.url, this.request);
        }
        Poll() { // xxx use Ajax.Poll
            this.url += "poll/-1";
            this.request = {
                command: "?attach",
                version: "10.40.001",
                unique_name: -1,
                id: -1,
                gen: 1
            };
            return ww.Ajax.Post(this.url, this.request);
        }
    }

    ww.Test000Prototype = new Test000Prototype();

})();
