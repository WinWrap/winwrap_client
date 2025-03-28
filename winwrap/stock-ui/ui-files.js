﻿//FILE: ui-files.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2020 Polar Engineering, Inc.
// All rights reserved.

define(['./ui'], function () {

    class InputMacro {
        constructor(ui, channel, element) {
            this.ui_ = ui;
            this.channel_ = channel;
            this.macros_ = [];
            this.element_ = element;
            this.newmacro = false;
            this.dir_ = '\\';
            channel.AddResponseHandlers({
                detach: response => {
                    // disable the input box selection list
                    this.element_.autocomplete('disable');
                },
                new: response => {
                    this.newmacro = true;
                    channel.PushPendingRequest({ request: '?read', target: response.name });
                },
                opendialog: response => {
                    this._SetFileValues(response.names.map(item => item.name));
                },
                read: response => {
                    // only read the first file
                    let file = response.files[0];
                    this._SetFileValue(file.name.replace(/^\\/, ''));
                    channel.CommitRebase.Read(file);
                    channel.SetStatusBarText(channel.VersionInfo());
                    channel.PushPendingRequest({ request: '?breaks', target: file.name });
                    channel.PushPendingRequest({ request: '?state', target: file.name });
                    let response2 = { response: '_clear_error' };
                    channel.ProcessResponse(response2);
                },
                state: response => {
                    //this.Enabled(!response.macro_loaded);
                },
                _save: response => {
                    let name = channel.CommitRebase.Name();
                    let newname = this._GetFileValue();
                    channel.PushPendingCommit();
                    channel.PushPendingRequest({ request: '?write', target: name, new_name: newname });
                    channel.PushPendingRequest({ request: '?opendialog', dir: this.dir_, exts: 'wwd|bas' });
                },
                _saved: response => {
                    this.newmacro = false;
                    this._SetFileValue(response.name.replace(/^\\/, ''));
                    channel.CommitRebase.HandleSavedResponse(response);
                }
            });
            this.element_.autocomplete({
                source: (request, response) => {
                    if (!this.newmacro) {
                        let buttonSave = this.ui_.items_['ww-item-save'];
                        buttonSave.Enabled(false);
                    }
                    let term = $.ui.autocomplete.escapeRegex(request.term);
                    let matcher = new RegExp(`^.*${term}.*$`, 'i');
                    response($.grep(this.macros_, element => {
                        return matcher.test(element);
                    }));
                },
                minLength: 0
            });
            this.element_.on('autocompleteselect', (event, ui) => {
                let value = ui.item.value;
                if (value !== '\\') {
                    value = '\\'.concat(value);
                }
                channel.PushPendingRequest({ request: '?read', target: value });
                if (value.slice(-1) === '\\') {
                    this.dir_ = value;
                    channel.PushPendingRequest({ request: '?opendialog', dir: this.dir_, exts: 'wwd|bas' });
                }
            });
            this.element_.on('focus', (event, ui) => {
                this.element_.autocomplete('search', '');
            });
        }
        _GetFileValue() {
            return this.element_.val();
        }
        _SetFileValue(value) {
            this.element_.val(value);
        }
        _GetParentDirs() {
            let dirs = [];
            if (this.dir_ !== '\\') {
                dirs.push('\\');
                let parent = this.dir_.split('\\').slice(0, -2).join('\\').concat('\\');
                if (parent !== '\\') {
                    parent = parent.replace(/^\\/, '');
                    dirs.push(parent);
                }
            }
            return dirs;
        }
        _SetFileValues(values) {
            let first = this.macros_.length === 0;
            this.macros_ = values.map(str => str.replace(/^\\/, ''));
            this.macros_ = this.macros_.concat(this._GetParentDirs());
            if (first) {
                if (values.includes('\\Sample1.bas')) {
                    this.channel_.PushPendingRequest({ request: '?read', target: '\\Sample1.bas' });
                }
                else {
                    this.channel_.PushPendingRequest({ request: '?new', names: [] });
                }
            }
        }
    }

    ww.InputMacro = InputMacro;

    class ButtonNew extends ww.Button {
        constructor(ui, channel, element) {
            super(ui, channel, element, () => {
                channel.PushPendingRequest({ request: '?new', kind: 'Macro', has_main: true, names: [] });
            });
            channel.AddResponseHandlers({
                state: response => {
                    this.Enabled(!response.macro_loaded);
                }
            });
        }
    }

    ww.ButtonNew = ButtonNew;

    class ButtonSave extends ww.Button {
        constructor(ui, channel, element) {
            super(ui, channel, element, () => {
                let response = { response: "_save" };
                channel.ProcessResponse(response);
            });
            channel.AddResponseHandlers({
                state: response => {
                    this.Enabled(true);
                },
                write: response => {
                    if (response.success) {
                        let response2 = { response: "_saved", name: response.name, revision: response.revision };
                        channel.ProcessResponse(response2);
                    }
                    else {
                        alert(response.error);
                    }
                }
            });
        }
    }

    ww.ButtonSave = ButtonSave;

});
