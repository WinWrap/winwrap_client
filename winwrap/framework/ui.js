//FILE: ui.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class UI {
        constructor(channel, name) {
            this.Channel = channel;
            this.Name = name;
            this.items_ = {};
        }
        Initialize() {
            Object.values(this.items_).forEach(item => {
                if ('Initialize' in item) {
                    item.Initialize();
                }
            });
            this.StatusBar = this.items_['ww-item-statusbar'];
            this.EditorImmediate = this.items_['ww-item-immediate'];
            this.EditorWatch = this.items_['ww-item-watch'];
            this.EditorCode = this.items_['ww-item-code'];
            this.Decorate = this.EditorCode.Decorate;
            this.Channel.CommitRebase.SetEditor(this.EditorCode);
        }
        AddItem(item, name) {
            if (item !== undefined) {
                this.items_[name] = item;
            }
        }
        GetFileValue(response) {
            let item = this.items_['ww-item-files'];
            return item !== undefined ? item.GetFileValue() : '?A1';
        }
        SetFileValue(response) {
            let item = this.items_['ww-item-files'];
            if (item !== undefined) {
                item.SetFileValue(response);
            }
        }
        SetFileValues(response) {
            let item = this.items_['ww-item-files'];
            if (item !== undefined) {
                item.SetFileValues(response);
            }
        }
        SetState(response) {
            Object.values(this.items_).forEach(item => {
                if ('SetState' in item) {
                    item.SetState(response);
                }
            });
            // update current line
            this.Decorate.Stack.SetStack(response);
            this.EditorImmediate.SetVisible(!response.is_idle);
        }
        Process(response) {
            if (response.id === -1) {
                // all channel's process the notification
                this._ProcessNotification(response);
            } else {
                // only the requesting channel processes the response
                this._ProcessResponse(response);
            }
        }
        _ProcessNotification(notification) {
            switch (notification.response) { // each case => one requests
                case '!break': // notification
                    this.Decorate.Breaks.SetBreak(notification);
                    break;
                case '!notify_begin': // notification
                    this.SetState(notification);
                    break;
                case '!notify_debugclear': // notification
                    // need a this.EditorImmediate method to clear the immediate text
                    break;
                case '!notify_debugprint': // notification
                    this.EditorImmediate.AppendText(notification.text);
                    this.EditorImmediate.ScrollToBottom();
                    break;
                case '!notify_end': // notification
                    this.SetState(notification);
                    break;
                case '!notify_errorlog': // notification
                    break;
                case '!notify_errors': // notification
                    /*alert(notification.error.macro_name + '@' + notification.error.line_num + ': ' +
                        notification.error.line + '\n' + notification.error.desc);*/
                    if (this.Channel.CommitRebase.Name() !== notification.error.macro_name) {
                        this.Channel.PushPendingRequest({ command: '?read', target: notification.error.macro_name });
                    }
                    // should highlight the error line in red and scroll to it
                    // notification.error.line_num
                    // notification.error.offset (index into the line where the error occurred, -1 for runtime error)
                    this.Decorate.SyntaxError.SetError(notification);
                    break;
                case '!notify_macrobegin': // notification
                    break;
                case '!notify_macroend': // notification
                    break;
                case '!notify_pause': // notification
                    if (this.Channel.CommitRebase.Name() !== notification.file_name) {
                        this.Channel.PushPendingRequest({ command: '?read', target: notification.file_name });
                    }
                    let watches = this.EditorWatch.GetText().trim().split(/[\r]?\n/).filter(el => { return el !== ''; });
                    if (watches.length >= 1) { // xxx
                        this.Channel.PushPendingRequest({ command: '?watch', watches: watches });
                    }
                    this.SetState(notification);
                    let pauseLine = notification.stack[0].linenum;
                    let editor = this.Channel.UI.EditorCode;
                    editor.ScrollToLine(pauseLine);
                    break;
                case '!notify_resume': // notification
                    this.SetState(notification);
                    break;
                case '!rebase': // notification
                    this.Channel.CommitRebase.Rebase(notification);
                    break;
                default:
                    break;
            }
        }
        _ProcessResponse(response) {
            switch (response.response) { // each case => one requests
                case '!breaks': // response
                    this.Decorate.Breaks.SetBreaks(response);
                    break;
                case '!commit':
                    this.Channel.CommitRebase.CommitDone(response);
                    break;
                case '!new': // response
                    this.Channel.PushPendingRequest({ command: '?read', target: response.name });
                    break;
                case '!opendialog': // response
                    this.SetFileValues(response.names.map(item => item.name));
                    break;
                case '!read': // response
                    // only read the first file
                    let file = response.files[0];
                    this.SetFileValue(file.name);
                    this.Channel.CommitRebase.Read(file);
                    this.Channel.PushPendingRequest({ command: '?breaks', target: file.name });
                    this.Channel.PushPendingRequest({ command: '?state', target: file.name });
                    break;
                case '!state': // response
                    this.SetState(response);
                    break;
                case '!stack': // response
                    this.Decorate.Stack.SetStack(response);
                    break;
                case '!syntax': // response
                    /*if (response.okay) {
                        alert('No syntax errors.');
                    }*/
                    this.Decorate.SyntaxError.SetError(response);
                    break;
                case '!watch': // response
                    let watchResults = response.results.map(item => {
                        let value = item.error !== undefined ? item.error : item.value;
                        return `${item.depth}: ${item.expr} -> ${value}`;
                    }).join('\n');
                    this.EditorWatch.SetText(watchResults);
                    break;
                case '!write': // response
                    break;
                default:
                    break;
            }
        }
    }

    ww.UI = UI;

    class Browser {
        constructor() { }
        Log(json) {
            let text = JSON.stringify(json, undefined, 2);
            $('#jsondata').append(text + '<br />');
        }
    }

    ww.Browser = new Browser();

});
