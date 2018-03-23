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
                case 'ww-item-new': item = new ButtonNew(channel, element); break;
                case 'ww-item-files': item = new InputMacro(channel, element); break;
                case 'ww-item-save': item = new ButtonSave(channel, element); break;
                case 'ww-item-check': item = new ButtonCheck(channel, element); break;
                case 'ww-item-run': item = new ButtonRun(channel, element); break;
                case 'ww-item-pause': item = new ButtonPause(channel, element); break;
                case 'ww-item-end': item = new ButtonEnd(channel, element); break;
                case 'ww-item-into': item = new ButtonInto(channel, element); break;
                case 'ww-item-over': item = new ButtonOver(channel, element); break;
                case 'ww-item-out': item = new ButtonOut(channel, element); break;
                case 'ww-item-cycle': item = new ButtonCycle(channel, element); break;
                case 'ww-item-immediate': item = new ww.MonacoImmediateEditor(channel, element); break;
                case 'ww-item-watch': item = new ww.MonacoWatchEditor(channel, element); break;
                case 'ww-item-code': item = new ww.MonacoCodeEditor(channel, element); break;
                case 'ww-item-statusbar': item = new StatusBar(channel, element); break;
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

    class Button_Helper {
        constructor(element, clickhandler) {
            this.element_ = element;
            this.element_.button(); // make sure the button is initialized
            if (clickhandler !== undefined) {
                this.element_.click(clickhandler);
            }
            this.Enabled(false);
        }
        Enabled(enable) {
            this.element_.button(enable ? 'enable' : 'disable');
        }
    }

    class ButtonNew {
        constructor(channel, element) {
            let button = new Button_Helper(element,
                () => {
                    channel.PushPendingRequest({ command: '?new', kind: 'Macro', has_main: true, names: [] });
                });
            this.button_ = button;
            channel.AddResponseHandlers({
                state: response => {
                    button.Enabled(!response.macro_loaded);
                }
            });
        }
    }

    class InputMacro {
        constructor(channel, element) {
            this.channel_ = channel;
            this.macros_ = []; // xxx Macros
            this.element_ = element;
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddResponseHandlers({
                new: response => {
                    channel.PushPendingRequest({ command: '?read', target: response.name });
                },
                opendialog: response => {
                    this_.SetFileValues(response.names.map(item => item.name));
                },
                read: response => {
                    // only read the first file
                    let file = response.files[0];
                    this_.SetFileValue(file.name);
                    channel.CommitRebase.Read(file);
                    channel.PushPendingRequest({ command: '?breaks', target: file.name });
                    channel.PushPendingRequest({ command: '?state', target: file.name });
                },
                state: response => {
                    //button.Enabled(!response.macro_loaded);
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
        GetFileValue() {
            return this.element_.val();
        }
        SetFileValue(value) {
            this.element_.val(value);
        }
        SetFileValues(values) {
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

    class ButtonSave {
        constructor(channel, element) {
            let button = new Button_Helper(element,
                () => {
                    let name = channel.CommitRebase.Name();
                    let inputMacro = channel.UI.GetItem('ww-item-files');
                    let newname = inputMacro.GetFileValue();
                    channel.PushPendingCommit();
                    channel.PushPendingRequest({ command: '?write', target: name, new_name: newname }); // xyz
                    channel.PushPendingRequest({ command: '?opendialog', dir: '\\', exts: 'wwd|bas' });
                });
            this.button_ = button;
            channel.AddResponseHandlers({
                state: response => {
                    button.Enabled(true);
                }
            });
        }
    }

    class ButtonCheck {
        constructor(channel, element) {
            let button = new Button_Helper(element,
                () => {
                    channel.PushPendingCommit();
                    channel.PushPendingRequest({ command: '?syntax', target: channel.CommitRebase.Name() });
                });
            this.button_ = button;
            channel.AddResponseHandlers({
                state: response => {
                    button.Enabled(!response.macro_loaded);
                }
            });
        }
    }

    class ButtonRun {
        constructor(channel, element) {
            let button = new Button_Helper(element,
                () => {
                    channel.PushPendingCommit();
                    channel.PushPendingRequest({ command: 'run', target: channel.CommitRebase.Name() });
                });
            this.button_ = button;
            channel.AddResponseHandlers({
                state: response => {
                    button.Enabled(response.commands.run);
                }
            });
        }
    }

    class ButtonPause {
        constructor(channel, element) {
            let button = new Button_Helper(element,
                () => {
                    channel.PushPendingRequest({ command: 'pause', target: channel.CommitRebase.Name() });
                });
            this.button_ = button;
            channel.AddResponseHandlers({
                state: response => {
                    button.Enabled(response.commands.pause);
                }
            });
        }
    }

    class ButtonEnd {
        constructor(channel, element) {
            let button = new Button_Helper(element,
                () => {
                    channel.PushPendingRequest({ command: 'end', target: channel.CommitRebase.Name() });
                });
            this.button_ = button;
            channel.AddResponseHandlers({
                state: response => {
                    button.Enabled(response.commands.end);
                }
            });
        }
    }

    class ButtonInto {
        constructor(channel, element) {
            let button = new Button_Helper(element,
                () => {
                    channel.PushPendingCommit();
                    channel.PushPendingRequest({ command: 'into', target: channel.CommitRebase.Name() });
                });
            this.button_ = button;
            channel.AddResponseHandlers({
                state: response => {
                    button.Enabled(response.commands.into);
                }
            });
        }
    }

    class ButtonOver {
        constructor(channel, element) {
            let button = new Button_Helper(element,
                () => {
                    channel.PushPendingCommit();
                    channel.PushPendingRequest({ command: 'over', target: channel.CommitRebase.Name() });
                });
            this.button_ = button;
            channel.AddResponseHandlers({
                state: response => {
                    button.Enabled(response.commands.over);
                }
            });
        }
    }

    class ButtonOut {
        constructor(channel, element) {
            let button = new Button_Helper(element,
                () => {
                    channel.PushPendingRequest({ command: 'out', target: channel.CommitRebase.Name() });
                });
            this.button_ = button;
            channel.AddResponseHandlers({
                state: response => {
                    button.Enabled(response.commands.out);
                }
            });
        }
    }

    class ButtonCycle {
        constructor(channel, element) {
            let button = new Button_Helper(element,
                () => { // xxx
                    let editorImmediate = channel.UI.GetItem('ww-item-immediate');
                    let editorWatch = channel.UI.GetItem('ww-item-watch');
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
            this.button_ = button;
            channel.AddResponseHandlers({
                state: response => {
                    button.Enabled(true);
                }
            });
        }
    }

    class StatusBar {
        constructor(channel, element) {
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
