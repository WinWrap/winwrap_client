var ww = ww || {};

(function () {

    class AutoAuto {
        constructor() {
            this.Response = null;
        }
        async SendAsync(model, position) { // xxx block polling during auto...
            if (ww.Ajax.Tid !== undefined) {
                ww.Ajax.StopPolling();
            }
            this.notification_ = null;
            let textUntilPosition = ww.EditorCode.textUntilPosition(model, position);
            let requests = [];
            let expected = [];
            let requestCommit = ww.CommitRebase.GetCommitRequest();
            if (requestCommit === null) {
                expected = ["!auto"];
            } else {
                expected = ["!rebase", "!auto"];
                requests.push(requestCommit);
            }
            requests.push({
                command: "?auto",
                target: ww.InputMacro.GetValue(),
                first: textUntilPosition.length - (position.column - 1),
                offset: position.column - 1 // `${first}`
            });
            // wait for !rebase - instead of racing the polling against the next prototype keystroke
            let result = await new ww.AjaxPost().SendAsync(requests, expected).catch(err => {
                console.log("autoauto.js SendAsync ", err);
            });
            ww.Ajax.ProcessNotifications(result);
            if (ww.Ajax.Tid !== undefined) {
                ww.Ajax.StartPolling();
            }
            return result;
        }
    }

    ww.AutoAuto = new AutoAuto();

})();