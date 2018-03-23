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

        AddItem(item, name) {
            if (item !== undefined) {
                this.items_[name] = item;
            }
        }

        GetItem(name) {
            return this.items_[name];
        }
    }

    ww.UI = UI;

    ww.CreateItem = (channel, element, name) => {
        switch (name) {
            case 'ww-item-new': return new ButtonNew(channel, element);
            case 'ww-item-files': return new InputMacro(channel, element);
            case 'ww-item-save': return new ButtonSave(channel, element);
            case 'ww-item-check': return new ButtonCheck(channel, element);
            case 'ww-item-run': return new ButtonRun(channel, element);
            case 'ww-item-pause': return new ButtonPause(channel, element);
            case 'ww-item-end': return new ButtonEnd(channel, element);
            case 'ww-item-into': return new ButtonInto(channel, element);
            case 'ww-item-over': return new ButtonOver(channel, element);
            case 'ww-item-out': return new ButtonOut(channel, element);
            case 'ww-item-cycle': return new ButtonCycle(channel, element);
            case 'ww-item-immediate': return new ww.MonacoImmediateEditor(channel, element);
            case 'ww-item-watch': return new ww.MonacoWatchEditor(channel, element);
            case 'ww-item-code': return new ww.MonacoCodeEditor(channel, element);
            case 'ww-item-statusbar': return new StatusBar(channel, element);
        }
    };

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
