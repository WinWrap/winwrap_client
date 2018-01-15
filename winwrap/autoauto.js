define(function () {

    class AutoAuto {
        constructor(basic) {
            this.Basic = basic;
            this.Response = null;
        }
        async SendAsync(model, position) { // xxx block polling during auto...
            this.Basic.StopPolling();
            this.notification_ = null;
            let textUntilPosition = this.Basic.EditorCode.textUntilPosition(model, position);
            this.Basic.PushPendingRequest(this.Basic.CommitRebase.GetCommitRequest());
            let request = {
                command: "?auto",
                target: this.Basic.CommitRebase.Name,
                first: textUntilPosition.length - (position.column - 1),
                offset: position.column - 1 // `${first}`
            };
            let response = await this.Basic.SendAsync(request, "!auto").catch(err => {
                console.log("ERROR autoauto.js SendAsync ", err);
            });
            this.Response = response; // for use by autocomplete/signaturehelp
            this.Basic.StartPolling();
            return response;
        }
    }

    ww.AutoAuto = AutoAuto;

});