define(function () {

    class AutoAuto {
        constructor(ui, element) {
            this.UI = ui;
            this.Element = element;
            this.AutoComplete = new ww.AutoComplete(this);
            this.SignatureHelp = new ww.SignatureHelp(this);
        }
        async SendAsync(model, position) { // xxx block polling during auto...
            let channel = this.UI.Channel;
            channel.StopPolling();
            let textUntilPosition = this.Element.textUntilPosition(model, position);
            channel.PushPendingRequest(channel.CommitRebase.GetCommitRequest());
            let request = {
                command: '?auto',
                target: channel.CommitRebase.Name,
                first: textUntilPosition.length - (position.column - 1),
                offset: position.column - 1 // `${first}`
            };
            let response = await channel.SendAsync(request, '!auto').catch(err => {
                console.log('ERROR autoauto.js SendAsync ', err);
            });
            channel.StartPolling();
            return response;
        }
    }

    ww.AutoAuto = AutoAuto;

});