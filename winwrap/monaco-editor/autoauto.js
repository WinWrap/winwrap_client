//FILE: autoauto.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class AutoAuto {

        constructor() {
            this.AutoComplete = new ww.AutoComplete(this);
            this.SignatureHelp = new ww.SignatureHelp(this);
            this.busy1_ = false;
            this.busy2_ = false;
            this.ready1_ = false;
            this.sharedResponse_ = null;
        }

        IsBusy() {
            return this.busy1_ || this.busy2_;
        }

        async SendAndReceiveAsync(model, position) { // xxx block polling during auto...
            let editor = ww.MonacoShared.GetEditor(model);
            let channel = editor.Channel;
            let remote = channel.Remote;
            // wait for Channel.Poll to finish
            while (remote.PollBusy())
                await remote._Wait(10);
            if (this.busy2_ || this.ready1_) {
                // two SendAndReceiveAsync calls are busy, give up
                return null;
            }
            if (this.busy1_) { // share response from first SendAndReceiveAsync
                return await this._GetSharedResponseAsync();
            }
            this.busy1_ = true; // first SendAndReceiveAsync call is busy
            remote.StopPolling();
            channel.PushPendingCommit();
            let rule = '';
            let fragment = '';
            if (editor.Container !== 'code') {
                rule = editor.Container;
                fragment = this.TextUntilPosition(model, position);
            }
            let request = {
                command: '?auto',
                target: channel.CommitRebase.Name(),
                first: 0,
                offset: editor.CodeEditor.GetSelection().first,
                rule: rule,
                fragment: fragment
            };
            let response = null;
            try {
                response = await channel.SendAndReceiveAsync(request, '!auto');
            } catch (e) {
                console.log("ww-error: AutoAuto.SendAndReceiveAsync failed");
            }
            if (this.busy2_) { // share response to second SendAndReceiveAsync
                await this._SetSharedResponseAsync(response);
            }
            remote.StartPolling();
            this.busy1_ = false; // first SendAndReceiveAsync call is done
            return response;
        }

        async _GetSharedResponseAsync() {
            console.log("AutoAuto.SendAndReceiveAsync call in progress (wait for shared response)...");
            let editor = ww.MonacoShared.GetEditor(model);
            let channel = editor.Channel;
            let remote = this.channel.Remote;
            // wait until first SendAndReceiveAsync call has a response
            this.busy2_ = true; // second SendAndReceiveAsync call is busy
            // wait for first SendAndReceiveAsync to get a response
            while (!this.ready1_)
                await remote._Wait(50);
            // first SendAndReceiveAsync's call has a response
            let response = this.sharedResponse_;
            this.busy2_ = false; // second SendAndReceiveAsync call is done
            this.ready1_ = false; // let first SendAndReceiveAsync complete
            return response;
        }

        async _SetSharedResponseAsync(response) {
            let editor = ww.MonacoShared.GetEditor(model);
            let channel = editor.Channel;
            let remote = this.channel.Remote;
            // share first SendAndReceiveAsync call's response with the send SendAndReceiveAsync call
            this.sharedResponse_ = response;
            this.ready1_ = true; // first SendAndReceiveAsync call has a response
            // wait for second SendAndReceiveAsync call to get the response
            while (this.ready1_)
                await remote._Wait(10);
            // first SendAndReceiveAsync call is done
            this.sharedResponse_ = null;
            console.log("AutoAuto.SendAndReceiveAsync response has been shared.");
        }

        TextUntilPosition(model, position) {
            let text = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });
            return text;
        }
    }

    ww.AutoAuto = AutoAuto;

});