//FILE: channel.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(function () {
    class Channel {
        constructor(remote, name) {
            this.Remote = remote;
            this.Name = name;
            this.UI = undefined; // set Basic async _InitializeAsync(factory)
            this.ClientID = ('0000000000' + Math.floor(Math.random() * 2147483647)).slice(-10).toString();
            this.AllocatedID = 0; // explicitly set in ?attach
            this.Version = undefined;
            this.generation_ = 0;
            this.commitcounter_ = 0;
            this.busy_ = false;
            this.handlers_ = [];
        }
        async InitializeAsync() {
            while (this.busy_)
                this.Remote._Wait(100);

            this.busy_ = true;
            this.CommitRebase = new ww.CommitRebase(this);
            this.UI.Initialize();
            let request = { command: '?attach', version: '10.40.001', unique_name: this.ClientID };
            let attach = undefined;
            try {
                attach = await this.SendAndReceiveAsync(request, '!attach');
            } catch (err) {
                console.log('ERROR channel.js InitializeAsync ', err);
                let attachErrMsg = `${this.Name} ${request.command} threw error`;
                this.UI.StatusBar.SetText(attachErrMsg);
            }
            this.busy_ = false;
            if (attach.unique_name !== this.ClientID) {
                alert(`${this.Name} ${request.command} failed ${attach.unique_name} !== ${this.ClientID}`);
                return;
            }
            this.AllocatedID = attach.allocated_id;
            this.Version = attach.version;
            this.UI.StatusBar.SetVersionChannelInfo();
            this.PushPendingRequest({ command: '?opendialog', dir: '\\', exts: 'wwd|bas' });
            this.PushPendingRequest({ command: '?stack' });
            // now UI is initialized
        }
        AddResponseHandlers(handlers) {
            Object.keys(handlers).forEach(key => {
                let response = '!' + key;
                if (this.handlers_[response] === undefined) {
                    this.handlers_[response] = [];
                }
                let handler = handlers[key];
                this.handlers_[response].push(handler);
                if (key === 'state') {
                    this.AddResponseHandlers({
                        notify_begin: handler,
                        notify_end: handler,
                        notify_pause: handler,
                        notify_resume: handler
                    });
                }
            });
        }
        PushPendingRequest(request) {
            if (request) {
                request.datetime = new Date().toLocaleString();
                request.id = this.AllocatedID;
                request.gen = this._NextGeneration();
                this.Remote.PushPendingRequest(request);
            }
        }
        async SendAndReceiveAsync(request, expected) {
            request.datetime = new Date().toLocaleString();
            request.id = this.AllocatedID;
            request.gen = this._NextGeneration();
            let result = await this.Remote.SendAndReceiveAsync(request, expected, request.id);
            //console.log(`Channel.SendAndReceiveAsync expected = ${expected}`);
            return result;
        }
        Poll() {
            if (++this.commitcounter_ === 20) {
                // push any pending commits (approx once every 2 seconds)
                this.PushPendingCommit();
                this.commitcounter_ = 0;
            }
        }
        ProcessResponse(response) {
            let handlers = this.handlers_[response.response];
            if (handlers !== undefined) {
                handlers.forEach(handler => handler(response));
            }
        }
        PushPendingCommit() {
            this.PushPendingRequest(this.CommitRebase.GetCommitRequest());
        }
        _NextGeneration() {
            if (++this.generation_ === 0x10000)
                this.generation_ = 1; // 16 bit number (never 0)
            return this.generation_;
        }
    }

    ww.Channel = Channel;
});
