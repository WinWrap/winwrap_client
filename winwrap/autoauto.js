define(function () {

    class AutoAuto {
        constructor(ui, element) {
            this.UI = ui;
            this.Element = element;
            this.AutoComplete = new ww.AutoComplete(this);
            this.SignatureHelp = new ww.SignatureHelp(this);
            this.busy_ = false;
        }
        async SendAsync(model, position, textUntilPosition) { // xxx block polling during auto...
            if (this.busy_) {
                return null;
            }
            this.busy_ = true;
            let channel = this.UI.Channel;
            channel.StopPolling();
            channel.PushPendingRequest(channel.CommitRebase.GetCommitRequest());
            let request = {
                command: '?auto',
                target: channel.CommitRebase.Name,
                first: textUntilPosition.length - (position.column - 1),
                offset: position.column - 1 // `${first}`
            };
            let response = null;
            try {
                response = await channel.SendAsync(request, '!auto');
            } catch (e) {
                console.log("ww-error: AutoAuto.SendAsync failed");
            }
            channel.StartPolling();
            this.busy_ = false;
            return response;
        }
    }

    ww.AutoAuto = AutoAuto;

});