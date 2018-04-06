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
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddResponseHandlers({
                detached: response => {
                    if (response.detached_id === 0 || response.detached_id === channel.AllocatedID) {
                        // disable the input box
                    }
                },
                new: response => {
                    channel.PushPendingRequest({ command: '?read', target: response.name });
                },
                opendialog: response => {
                    this_._SetFileValues(response.names.map(item => item.name));
                },
                read: response => {
                    // only read the first file
                    let file = response.files[0];
                    this_._SetFileValue(file.name);
                    channel.CommitRebase.Read(file);
                    channel.PushPendingRequest({ command: '?breaks', target: file.name });
                    channel.PushPendingRequest({ command: '?state', target: file.name });
                },
                state: response => {
                    //this_.Enabled(!response.macro_loaded);
                },
                _save: response => {
                    let name = channel.CommitRebase.Name();
                    let newname = this_._GetFileValue();
                    if (name !== '?A1' && name !== newname) {
                        alert(`To save ${name} as ${newname}, copy ${name} contents into a new file, set name to ${newname}, then Save.`);
                        this_._SetFileValue(name);
                        return;
                    }
                    channel.PushPendingCommit();
                    channel.PushPendingRequest({ command: '?write', target: name, new_name: newname });
                    channel.PushPendingRequest({ command: '?opendialog', dir: '\\', exts: 'wwd|bas' });
                },
                _saved: response => {
                    this_._SetFileValue(response.name);
                    channel.CommitRebase.HandleSavedResponse(response);
                }
            });
            this.element_.autocomplete({
                source: (request, response) => {
                    let term = $.ui.autocomplete.escapeRegex(request.term);
                    let matcher = new RegExp(`^.*${term}.*$`, 'i');
                    response($.grep(this_.macros_, element => {
                        return matcher.test(element);
                    }));
                },
            });
            this.element_.on('autocompleteselect', (event, ui) => {
                let ui__ = this_.ui_;
                channel.PushPendingRequest({ command: '?read', target: ui.item.value });
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
            if (first) {
                if (values.find(item => item === '\\Sample1.bas')) {
                    this.channel_.PushPendingRequest({ command: '?read', target: '\\Sample1.bas' });
                }
                else {
                    this.channel_.PushPendingRequest({ command: '?new', names: [] });
                }
            }
        }
    }

    ww.InputMacro = InputMacro;

    class ButtonNew extends ww.Button {
        constructor(ui, channel, element) {
            super(ui, channel, element, () => {
                channel.PushPendingRequest({ command: '?new', kind: 'Macro', has_main: true, names: [] });
            });
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddResponseHandlers({
                state: response => {
                    this_.Enabled(!response.macro_loaded);
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
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddResponseHandlers({
                state: response => {
                    this_.Enabled(true);
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
