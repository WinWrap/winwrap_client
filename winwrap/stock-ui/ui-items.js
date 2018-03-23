//FILE: ui-items.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define([
    './decorate'], function () {

    ww.CreateItem = (ui, element, name) => {
        switch (name) {
            case 'ww-item-new': return new ButtonNew(ui, element);
            case 'ww-item-files': return new InputMacro(ui, element);
            case 'ww-item-save': return new ButtonSave(ui, element);
            case 'ww-item-check': return new ButtonCheck(ui, element);
            case 'ww-item-run': return new ButtonRun(ui, element);
            case 'ww-item-pause': return new ButtonPause(ui, element);
            case 'ww-item-end': return new ButtonEnd(ui, element);
            case 'ww-item-into': return new ButtonInto(ui, element);
            case 'ww-item-over': return new ButtonOver(ui, element);
            case 'ww-item-out': return new ButtonOut(ui, element);
            case 'ww-item-cycle': return new ButtonCycle(ui, element);
            case 'ww-item-immediate': return new ww.MonacoEditor(ui, element, 'immediate');
            case 'ww-item-watch': return new ww.MonacoEditor(ui, element, 'watch');
            case 'ww-item-code': return new ww.MonacoEditor(ui, element, 'code');
            case 'ww-item-statusbar': return new StatusBar(ui, element);
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
        constructor(ui, element) {
            let channel = ui.Channel;
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
        constructor(ui, element) {
            //let button = new Button_Helper(element);
            this.UI = ui;
            let channel = ui.Channel;
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
                let channel = this.UI.Channel;
                if (values.find(item => item === '\\Sample1.bas')) {
                    channel.PushPendingRequest({ command: '?read', target: '\\Sample1.bas' });
                }
                else {
                    channel.PushPendingRequest({ command: '?new', names: [] });
                }
            }
        }
    }

    class ButtonSave {
        constructor(ui, element) {
            let channel = ui.Channel;
            let button = new Button_Helper(element,
                () => {
                    let name = channel.CommitRebase.Name();
                    let inputMacro = ui.items_['ww-item-files'];
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
        constructor(ui, element) {
            let channel = ui.Channel;
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
        constructor(ui, element) {
            let channel = ui.Channel;
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
        constructor(ui, element) {
            let channel = ui.Channel;
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
        constructor(ui, element) {
            let channel = ui.Channel;
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
        constructor(ui, element) {
            let channel = ui.Channel;
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
        constructor(ui, element) {
            let channel = ui.Channel;
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
        constructor(ui, element) {
            let channel = ui.Channel;
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
        constructor(ui, element) {
            let channel = ui.Channel;
            let button = new Button_Helper(element,
                () => { // xxx
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
            this.button_ = button;
            channel.AddResponseHandlers({
                state: response => {
                    button.Enabled(true);
                }
            });
        }
    }

    class StatusBar {
        constructor(ui, element) {
            this.UI = ui;
            let this0 = this;
            this.element_ = element;
            this.UI.Channel.StatusBar = this;
        }
        Initialize() {
        }
        SetText(text) {
            this.element_.text(text);
        }
    }

});

// code snippets

/* use in StatsBar constructor
    this.element_.click(() => {
        console.log(`StatusBar line clicked at ${new Date().toLocaleString()}.`);
        let editor = this0.UI.EditorCode;
        editor.SetSelection( { first: 3, last: 7 } );
        let obj = editor.GetSelection(); // necessary for console.log expansion
        console.log(obj);
    });
*/

/*detect code editor "Enter" key
    editor.onKeyUp(function (e) {
        if (e.keyCode === monaco.KeyCode.Enter) { // 3 not 13
            console.log("e.keyCode === monaco.KeyCode.Enter");
        }
    });
*/

/*
    editor.trigger('mysource', 'editor.action.triggerSuggest', {});
    editor.trigger('mysource', 'editor.action.triggerParameterHints', {});
*/
