define(function () {

    class AutoAuto {
        constructor(ui, editor) {
            this.UI = ui;
            this.Editor = editor;
            this.AutoComplete = new ww.AutoComplete(this);
            this.SignatureHelp = new ww.SignatureHelp(this);
            this.busy1_ = false;
            this.busy2_ = false;
            this.ready1_ = false;
            this.sharedResponse_ = null;
        }
        async SendAsync(model, position, textUntilPosition) { // xxx block polling during auto...
            if (this.busy2_ || this.ready1_) {
                // two SendAsync calls are busy, give up
                return null;
            }
            if (this.busy1_) { // share response from first SendAsync
                return await this._GetSharedResponseAsync();
            }
            this.busy1_ = true; // first SendAsync call is busy
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
            if (this.busy2_) { // share response to second SendAsync
                await this._SetSharedResponseAsync(response);
            }
            channel.StartPolling();
            this.busy1_ = false; // first SendAsync call is done
            return response;
        }
        async _GetSharedResponseAsync() {
            console.log("AutoAuto.SendAsync call in progress (wait for shared response)...");
            // wait until first SendAsync call has a response
            this.busy2_ = true; // second SendAsync call is busy
            // wait for first SendAsync to get a response
            while (!this.ready1_)
                await this._Wait(50);
            // first SendAsync's call has a response
            let response = this.sharedResponse_;
            this.busy2_ = false; // second SendAsync call is done
            this.ready1_ = false; // let first SendAsync complete
            return response;
        }
        async _SetSharedResponseAsync(response) {
            // share first SendAsync call's response with the send SendAsync call
            this.sharedResponse_ = response;
            this.ready1_ = true; // first SendAsync call has a response
            // wait for second SendAsync call to get the response
            while (this.ready1_)
                await this._Wait(10);
            // first SendAsync call is done
            this.sharedResponse_ = null;
            console.log("AutoAuto.SendAsync response has been shared.");
        }
        _Wait(ms) {
            return new Promise(r => setTimeout(r, ms));
        }
    }

    ww.AutoAuto = AutoAuto;

});