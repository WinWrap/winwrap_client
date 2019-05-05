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
            this.AllocatedID = 0; // explicitly set in ?attach
            this.version_ = undefined;
            this.unique_name_ = ('0000000000' + Math.floor(Math.random() * 2147483647)).slice(-10).toString();
            this.generation_ = 0;
            this.busy_ = false;
            this.initHandlers_ = [];
            this.responseHandlers_ = [];
            this.logger_ = undefined;
        }

        async InitializeAsync() {
            while (this.busy_)
                await this.Remote._Wait(100);

            this.busy_ = true;
            this.CommitRebase = new ww.CommitRebase(this);

            // complete initialization
            this.initHandlers_.forEach(handler => handler());

            let request = { request: '?attach', version: '10.40.001', unique_name: this.unique_name_ };
            let attach = undefined;
            try {
                attach = await this.SendRequestAndGetResponseAsync(request);
            } catch (err) {
                console.log('ERROR channel.js InitializeAsync ', err);
                let attachErrMsg = `${this.Name} is not connected to the server`;
                this.SetStatusBarText(attachErrMsg);
                this.busy_ = false;
                return;
            }
            this.busy_ = false;
            if (attach.unique_name !== this.unique_name_) {
                alert(`${this.Name} ${request.request} failed ${attach.unique_name} !== ${this.unique_name_}`);
                return;
            }
            this.AllocatedID = attach.allocated_id;
            this.version_ = attach.version;
            this.SetStatusBarText(this.VersionInfo());
            this.PushPendingRequest({ request: '?opendialog', dir: '\\', exts: 'wwd|bas' });
            this.PushPendingRequest({ request: '?stack' });
            this.AddResponseHandlers({
                detach: response => {
                    this.Detach();
                }
            });
            // now UI is initialized
        }

        AddInitHandler(handler) {
            this.initHandlers_.push(handler);
        }

        AddResponseHandlers(handlers) {
            Object.keys(handlers).forEach(key => {
                let response = key[0] === '_' ? key : '!' + key;
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

        Detach() {
            this.SetStatusBarText('Detached at ' + new Date().toLocaleString());
            this.Remote.DetachChannel(this);
        }

        PushPendingCommit() {
            this.CommitRebase.PushPendingCommit();
        }

        PushPendingRequest(request) {
            if (request) {
                request.datetime = new Date().toLocaleString();
                request.id = this.AllocatedID;
                if (request.request !== undefined) {
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

        async SendRequestAndGetResponseAsync(request) {
            request.datetime = new Date().toLocaleString();
            request.id = this.AllocatedID;
            request.gen = this._NextGeneration(request.request === '?attach');
            this._Log('=>', request);
            let result = await this.Remote.SendRequestAndGetResponseAsync(request);
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

        VersionInfo() {
            let versionInfo = `WinWrap Version = ${this.version_}`;
            let channelInfo = `${this.Name} AllocatedID = ${this.AllocatedID}`;
            return `${versionInfo}, ${channelInfo}`;
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
