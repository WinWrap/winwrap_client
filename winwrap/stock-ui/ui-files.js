//FILE: ui-files.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
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
                    this._SetFileValue(file.name);
                    channel.CommitRebase.Read(file);
                    channel.SetStatusBarText(channel.VersionInfo());
                    channel.PushPendingRequest({ request: '?breaks', target: file.name });
                    channel.PushPendingRequest({ request: '?state', target: file.name });
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
                    this._SetFileValue(response.name);
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
            });
            this.element_.on('autocompleteselect', (event, ui) => {
                let value = ui.item.value;
                if (value.slice(-1) === '\\') {
                    this.dir_ = value;
                    channel.PushPendingRequest({ request: '?read', target: value });
                    channel.PushPendingRequest({ request: '?opendialog', dir: this.dir_, exts: 'wwd|bas' });
                } else {
                    channel.PushPendingRequest({ request: '?read', target: value });
                }
            });
        }
        _GetFileValue() {
            return this.element_.val();
        }
        _SetFileValue(value) {
            this.element_.val(value);
        }
        _SetFileValues(values) {
            let first = this.macros_.length === 0;
            this.macros_ = values;
            if (this.dir_ !== '\\') {
                this.macros_.push('\\');
                this.macros_.push('..');
            }
            if (first) {
                if (values.find(item => item === '\\Sample1.bas')) {
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
