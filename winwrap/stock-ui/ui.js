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

        AddItem(channel, element, name) {
            let item = undefined;
            switch (name) {
                case 'ww-item-new': item = new ww.ButtonNew(this, channel, element); break;
                case 'ww-item-files': item = new ww.InputMacro(this, channel, element); break;
                case 'ww-item-save': item = new ww.ButtonSave(this, channel, element); break;
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
                detach: response => {
                    this_.Enabled(false);
                }
            });
        }

        Enabled(enable) {
            this.element_.button(enable ? 'enable' : 'disable');
        }
    }

    ww.Button = Button;

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
            super(ui, channel, element, () => {
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
