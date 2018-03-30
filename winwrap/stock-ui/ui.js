//FILE: ui-items.js

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

        AddItem(channel, element, name) {
            let item = undefined;
            switch (name) {
                case 'ww-item-new': item = new ButtonNew(this, channel, element); break;
                case 'ww-item-files': item = new InputMacro(this, channel, element); break;
                case 'ww-item-save': item = new ButtonSave(this, channel, element); break;
                case 'ww-item-check': item = new ButtonCheck(this, channel, element); break;
                case 'ww-item-run': item = new ButtonRun(this, channel, element); break;
                case 'ww-item-pause': item = new ButtonPause(this, channel, element); break;
                case 'ww-item-end': item = new ButtonEnd(this, channel, element); break;
                case 'ww-item-into': item = new ButtonInto(this, channel, element); break;
                case 'ww-item-over': item = new ButtonOver(this, channel, element); break;
                case 'ww-item-out': item = new ButtonOut(this, channel, element); break;
                case 'ww-item-cycle': item = new ButtonCycle(this, channel, element); break;
                case 'ww-item-detach': item = new ButtonDetach(this, channel, element); break;
                case 'ww-item-immediate': item = new ww.MonacoImmediateEditor(this, channel, element); break;
                case 'ww-item-watch': item = new ww.MonacoWatchEditor(this, channel, element); break;
                case 'ww-item-code': item = new ww.MonacoCodeEditor(this, channel, element); break;
                case 'ww-item-statusbar': item = new StatusBar(this, channel, element); break;
                case 'ww-item-log': item = new ww.Log(this, channel, element); break;
            }
            if (item !== undefined) {
                this.items_[name] = item;
            }
        };

        GetItem(name) {
            return this.items_[name];
        }

    }

    ww.UI = UI;

    class Button {
        constructor(ui, channel, element, clickhandler) {
            this.element_ = element;
            this.element_.button(); // make sure the button is initialized
            this.element_.click(clickhandler);
            this.Enabled(false);
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddResponseHandlers({
                detached: response => {
                    if (response.detached_id === channel.AllocatedID) {
                        this_.Enabled(false);
                    }
                }
            });
        }

        Enabled(enable) {
            this.element_.button(enable ? 'enable' : 'disable');
        }
    }

    class ButtonNew extends Button {
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

    class InputMacro {
        constructor(ui, channel, element) {
            this.channel_ = channel;
            this.macros_ = []; // xxx Macros
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
                    channel.PushPendingCommit();
                    channel.PushPendingRequest({ command: '?write', target: name, new_name: newname }); // xyz
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
                    //console.log(term);
                    let matcher = new RegExp(`^.*${term}.*$`, 'i');
                    response($.grep(this_.macros_, element => { // xxx
                        return matcher.test(element);
                    }));
                }
            });
            this.element_.on('autocompleteselect', (event, ui) => {
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

    class ButtonSave extends Button {
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

    class ButtonCheck extends Button {
        constructor(ui, channel, element) {
            super(ui, channel, element, () => {
                channel.PushPendingCommit();
                channel.PushPendingRequest({ command: '?syntax', target: channel.CommitRebase.Name() });
            });
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddResponseHandlers({
                state: response => {
                    this_.Enabled(!response.macro_loaded);
                }
            });
        }
    }

    class ButtonRun extends Button {
        constructor(ui, channel, element) {
            super(ui, channel, element, () => {
                channel.PushPendingCommit();
                channel.PushPendingRequest({ command: 'run', target: channel.CommitRebase.Name() });
            });
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddResponseHandlers({
                state: response => {
                    this_.Enabled(response.commands.run);
                }
            });
        }
    }

    class ButtonPause extends Button {
        constructor(ui, channel, element) {
            super(ui, channel, element, () => {
                channel.PushPendingRequest({ command: 'pause', target: channel.CommitRebase.Name() });
            });
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddResponseHandlers({
                state: response => {
                    this_.Enabled(response.commands.pause);
                }
            });
        }
    }

    class ButtonEnd extends Button {
        constructor(ui, channel, element) {
            super(ui, channel, element, () => {
                channel.PushPendingRequest({ command: 'end', target: channel.CommitRebase.Name() });
            });
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddResponseHandlers({
                state: response => {
                    this_.Enabled(response.commands.end);
                }
            });
        }
    }

    class ButtonInto extends Button {
        constructor(ui, channel, element) {
            super(ui, channel, element, () => {
                channel.PushPendingCommit();
                channel.PushPendingRequest({ command: 'into', target: channel.CommitRebase.Name() });
            });
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddResponseHandlers({
                state: response => {
                    this_.Enabled(response.commands.into);
                }
            });
        }
    }

    class ButtonOver extends Button {
        constructor(ui, channel, element) {
            super(ui, channel, element, () => {
                channel.PushPendingCommit();
                channel.PushPendingRequest({ command: 'over', target: channel.CommitRebase.Name() });
            });
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddResponseHandlers({
                state: response => {
                    this_.Enabled(response.commands.over);
                }
            });
        }
    }

    class ButtonOut extends Button {
        constructor(ui, channel, element) {
            super(ui, channel, element, () => {
                channel.PushPendingRequest({ command: 'out', target: channel.CommitRebase.Name() });
            });
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddResponseHandlers({
                state: response => {
                    this_.Enabled(response.commands.out);
                }
            });
        }
    }

    class ButtonCycle extends Button {
        constructor(ui, channel, element) {
            super(ui, channel, element, () => { // xxx
                let editorImmediate = ui.GetItem('ww-item-immediate');
                let editorWatch = ui.GetItem('ww-item-watch');
                let immediateShowing = editorImmediate.GetVisibile();
                let watchShowing = editorWatch.GetVisibile();
                if (!immediateShowing && !watchShowing) {
                    editorImmediate.SetVisible(false);
                    editorWatch.SetVisible(true);
                } else if (!immediateShowing && watchShowing) {
                    editorImmediate.SetVisible(true);
                    editorWatch.SetVisible(false);
                } else if (immediateShowing && !watchShowing) {
                    editorImmediate.SetVisible(true);
                    editorWatch.SetVisible(true);
                } else if (immediateShowing && watchShowing) {
                    editorImmediate.SetVisible(false);
                    editorWatch.SetVisible(false);
                }
            });
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddResponseHandlers({
                state: response => {
                    this_.Enabled(!response.edit_only);
                }
            });
        }
    }

    class ButtonDetach extends Button {
        constructor(ui, channel, element) {
            super(ui, channel, element, () => {
                channel.PushPendingRequest({ command: 'detach' });
            });
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddResponseHandlers({
                state: response => {
                    this_.Enabled(true);
                }
            });
        }
    }

    class StatusBar {
        constructor(ui, channel, element) {
            this.element_ = element;
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddResponseHandlers({
                _statusbar: response => {
                    this_.element_.text(response.text);
                }
            });
        }
    }

});
