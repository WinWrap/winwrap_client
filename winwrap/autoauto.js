var ww = ww || {};

(function () {

    class AutoAuto {
        constructor() {
            this.Response = null;
        }
        async SendAsync(model, position) { // xxx block polling during auto...
            ww.Ajax.StopPolling();
            this.notification_ = null;
            let textUntilPosition = ww.EditorCode.textUntilPosition(model, position);
            ww.Ajax.PushPendingRequest(ww.CommitRebase.GetCommitRequest());
            let request = {
                command: "?auto",
                target: ww.CommitRebase.Name,
                first: textUntilPosition.length - (position.column - 1),
                offset: position.column - 1 // `${first}`
            };
            let response = await ww.Ajax.SendAsync(request, "!auto").catch(err => {
                console.log("ERROR autoauto.js SendAsync ", err);
            });
            ww.AutoAuto.Response = response; // for use by autocomplete/signaturehelp
            ww.Ajax.StartPolling();
            return response;
        }
    }

    ww.AutoAuto = new AutoAuto();

})();