var ww = ww || {};

(function () {

    class AttachPrototype { // singleton, but created in index.js
        constructor(api) {
            this.API = api;
            this.ClientID = ('0000000000' + Math.floor(Math.random() * 2147483647)).slice(-10).toString();
            this.AllocatedID = -0; // 0 explicitly set in ?attach
            this.generation_ = 1;
        }
        Generation() {
            return this.generation_++;
        }
        async ExecuteAsync() {
            let request = { command: "?attach", version: "10.40.001", unique_name: this.ClientID };
            let result = await new ww.AjaxPost().SendAsync(request, ["!attach"]).catch(err => {
                console.log("attach.js ExecuteAsync ", err);
            });
            let attach = result.find(o => o.response === "!attach");
            ww.WinWrapVersion.SetValue(attach.version);
            this.Response = attach;
            this.AllocatedID = attach.allocated_id;
            return result;
        }
    }

    ww.AttachPrototype = AttachPrototype;

})();
