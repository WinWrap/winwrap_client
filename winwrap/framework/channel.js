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
            this.CommitRebase = undefined;
            this.ClientID = ('0000000000' + Math.floor(Math.random() * 2147483647)).slice(-10).toString();
            this.AllocatedID = 0; // explicitly set in ?attach
            this.Version = undefined;
            this.generation_ = 0;
            this.commitcounter_ = 0;
            this.busy_ = false;
            this.initHandlers_ = [];
            this.responseHandlers_ = [];
            this.logger_ = undefined;
        }

        async InitializeAsync() {
            while (this.busy_)
                this.Remote._Wait(100);

            this.busy_ = true;
            this.CommitRebase = new ww.CommitRebase(this);

            // complete initialization
            this.initHandlers_.forEach(handler => handler());

            let request = { command: '?attach', version: '10.40.001', unique_name: this.ClientID };
            let attach = undefined;
            try {
                attach = await this.SendAndReceiveAsync(request, '!attach');
            } catch (err) {
                console.log('ERROR channel.js InitializeAsync ', err);
                let attachErrMsg = `${this.Name} is not connected to the server`;
                this.SetStatusBarText(attachErrMsg);
                this.busy_ = false;
                return;
            }
            this.busy_ = false;
            if (attach.unique_name !== this.ClientID) {
                alert(`${this.Name} ${request.command} failed ${attach.unique_name} !== ${this.ClientID}`);
                return;
            }
            this.AllocatedID = attach.allocated_id;
            this.Version = attach.version;
            let versionInfo = `WinWrap Version = ${this.Version}`;
            let channelInfo = `${this.Name} AllocatedID = ${this.AllocatedID}`;
            this.SetStatusBarText(`${versionInfo}, ${channelInfo}`);
            this.PushPendingRequest({ command: '?opendialog', dir: '\\', exts: 'wwd|bas' });
            this.PushPendingRequest({ command: '?stack' });
            // now UI is initialized
        }

        AddInitHandler(handler) {
            this.initHandlers_.push(handler);
        }

        AddResponseHandlers(handlers) {
            Object.keys(handlers).forEach(key => {
                let response = key[0] == '_' ? key : '!' + key;
                if (this.responseHandlers_[response] === undefined) {
                    this.responseHandlers_[response] = [];
                }
                let handler = handlers[key];
                this.responseHandlers_[response].push(handler);
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

        Poll() {
            if (++this.commitcounter_ === 20) {
                // push any pending commits (approx once every 2 seconds)
                this.PushPendingCommit();
                this.commitcounter_ = 0;
            }
        }

        PushPendingRequest(request) {
            if (request) {
                request.datetime = new Date().toLocaleString();
                request.id = this.AllocatedID;
                if (request.command.substring(0, 1) === '?') {
                    request.gen = this._NextGeneration(false);
                }
                this._Log('=>', request);
                this.Remote.PushPendingRequest(request);
            }
        }

        ProcessResponse(response) {
            this._Log('<=', response);
            let handlers = this.responseHandlers_[response.response];
            if (handlers !== undefined) {
                handlers.forEach(handler => handler(response));
            }
        }

        PushPendingCommit() {
            this.PushPendingRequest(this.CommitRebase.GetCommitRequest());
        }

        async SendAndReceiveAsync(request, expected) {
            request.datetime = new Date().toLocaleString();
            request.id = this.AllocatedID;
            request.gen = this._NextGeneration(request.command === '?attach');
            this._Log('=>', request);
            let result = await this.Remote.SendAndReceiveAsync(request, expected, request.id);
            //console.log(`Channel.SendAndReceiveAsync expected = ${expected}`);
            this._Log('<=', result);
            return result;
        }

        SetLogger(logger) {
            this.logger_ = logger;
        }

        SetStatusBarText(text) {
            let response = { response: '_statusbar', text: text };
            this.ProcessResponse(response);
        }

        _Log(label, data) {
            if (this.logger_ !== undefined) {
                this.logger_(label, data);
            }
        }

        _NextGeneration(reset) {
            if (reset) {
                this.generation_ = 0;
            } else if (++this.generation_ === 0x10000) {
                this.generation_ = 1; // 16 bit number (never 0)
            }
            return this.generation_;
        }
    }

    ww.Channel = Channel;

});
