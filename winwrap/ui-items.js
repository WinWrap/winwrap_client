define(function () {

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
            case 'ww-item-statusbar': return undefined;
            case 'ww-item-version': return new WinWrapVersion(ui, element);
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
            this.button_ = new Button_Helper(element,
                () => {
                    ui.Channel.PushPendingRequest({ command: '?new', kind: 'Macro', has_main: true, names: [] });
                });
        }
        SetState(response) {
            this.button_.Enabled(!response.macro_loaded);
        }
    }

    class InputMacro {
        constructor(ui, element) {
            //this.button_ = new Button_Helper(element);
            this.UI = ui;
            let channel = ui.Channel;
            this.macros_ = []; // xxx Macros
            this.element_ = element;
            let inputMacro = this; // closure can't handle this in the lambdas below
            this.element_.autocomplete({
                source: (request, response) => {
                    let term = $.ui.autocomplete.escapeRegex(request.term);
                    //console.log(term);
                    var matcher = new RegExp(`^.*${term}.*$`, 'i');
                    response($.grep(inputMacro.macros_, element => { // xxx
                        return matcher.test(element);
                    }));
                }
            });
            this.element_.on('autocompleteselect', (event, ui) => {
                channel.PushPendingRequest({ command: '?read', target: ui.item.value });
            });
        }
        SetState(response) {
            //this.button_.Enabled(!response.macro_loaded);
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
            this.button_ = new Button_Helper(element,
                () => {
                    //let code = ui.EditorCode.editor().getValue(); // xyz
                    let name = channel.CommitRebase.Name;
                    let newname = ui.GetFileValue();
                    channel.PushPendingCommit();
                    channel.PushPendingRequest({ command: '?write', target: name, new_name: newname }); // xyz
                    channel.PushPendingRequest({ command: '?opendialog', dir: '\\', exts: 'wwd|bas' });
                });
        }
        SetState(response) {
            this.button_.Enabled(true);
        }
    }

    class ButtonCheck {
        constructor(ui, element) {
            let channel = ui.Channel;
            this.button_ = new Button_Helper(element,
                () => {
                    channel.PushPendingCommit();
                    channel.PushPendingRequest({ command: '?syntax', target: channel.CommitRebase.Name });
                });
        }
        SetState(response) {
            this.button_.Enabled(!response.macro_loaded);
        }
    }

    class ButtonRun {
        constructor(ui, element) {
            let channel = ui.Channel;
            this.button_ = new Button_Helper(element,
                () => {
                    channel.PushPendingCommit();
                    channel.PushPendingRequest({ command: 'run', target: channel.CommitRebase.Name });
                });
        }
        SetState(response) {
            this.button_.Enabled(response.commands.run);
        }
    }

    class ButtonPause {
        constructor(ui, element) {
            let channel = ui.Channel;
            this.button_ = new Button_Helper(element,
                () => {
                    channel.PushPendingRequest({ command: 'pause', target: channel.CommitRebase.Name });
                });
        }
        SetState(response) {
            this.button_.Enabled(response.commands.pause);
        }
    }

    class ButtonEnd {
        constructor(ui, element) {
            let channel = ui.Channel;
            this.button_ = new Button_Helper(element,
                () => {
                    channel.PushPendingRequest({ command: 'end', target: channel.CommitRebase.Name });
                });
        }
        SetState(response) {
            this.button_.Enabled(response.commands.end);
        }
    }

    class ButtonInto {
        constructor(ui, element) {
            let channel = ui.Channel;
            this.button_ = new Button_Helper(element,
                () => {
                    channel.PushPendingCommit();
                    channel.PushPendingRequest({ command: 'into', target: channel.CommitRebase.Name });
                });
        }
        SetState(response) {
            this.button_.Enabled(response.commands.into);
        }
    }

    class ButtonOver {
        constructor(ui, element) {
            let channel = ui.Channel;
            this.button_ = new Button_Helper(element,
                () => {
                    channel.PushPendingCommit();
                    channel.PushPendingRequest({ command: 'over', target: channel.CommitRebase.Name });
                });
        }
        SetState(response) {
            this.button_.Enabled(response.commands.over);
        }
    }

    class ButtonOut {
        constructor(ui, element) {
            let channel = ui.Channel;
            this.button_ = new Button_Helper(element,
                () => {
                    channel.PushPendingRequest({ command: 'out', target: channel.CommitRebase.Name });
                });
        }
        SetState(response) {
            this.button_.Enabled(response.commands.out);
        }
    }

    class ButtonCycle {
        constructor(ui, element) {
            let channel = ui.Channel;
            this.button_ = new Button_Helper(element,
                () => { // xxx
                    let immediateShowing = ui.EditorImmediate.showing();
                    let watchShowing = ui.EditorWatch.showing();
                    if (!immediateShowing && !watchShowing) {
                        ui.EditorImmediate.hide();
                        ui.EditorWatch.show();
                    } else if (!immediateShowing && watchShowing) {
                        ui.EditorImmediate.show();
                        ui.EditorWatch.hide();
                    } else if (immediateShowing && !watchShowing) {
                        ui.EditorImmediate.show();
                        ui.EditorWatch.show();
                    } else if (immediateShowing && watchShowing) {
                        ui.EditorImmediate.hide();
                        ui.EditorWatch.hide();
                    }
                });
        }
        SetState(response) {
            this.button_.Enabled(true);
        }
    }

    class WinWrapVersion { // repurposed as a status line
        constructor(ui, element) {
            this.UI = ui;
            let this0 = this;
            this.element_ = element;
            this.element_.click(() => {
                console.log(`Status line clicked at ${new Date().toLocaleString()}.`);
                let editor = this0.UI.EditorCode.editor_;
                // getSelection
                //editor.setSelection(new monaco.Range(1, 2, 1, 4))
                editor.setSelection(new monaco.Range(3, 1, 3,8))
                let selection = editor.getSelection();
                console.log(`getSelection() => ${selection}`);
                /*
                // detect code editor "Enter" key
                editor.onKeyUp(function (e) {
                    if (e.keyCode === monaco.KeyCode.Enter) { // 3 not 13
                        console.log("e.keyCode === monaco.KeyCode.Enter");
                    }
                });
                */
                /*
                //editor.trigger('mysource', 'editor.action.triggerSuggest', {});
                //editor.trigger('mysource', 'editor.action.triggerParameterHints', {});
                */
            });
        }
        Initialize() {
            this.element_.text(`WinWrap Version = ${this.UI.Channel.Version}`);
        }
    }

    class Browser {
        constructor() { }
        Append(json) {
            let text = JSON.stringify(json, undefined, 2);
            $('#jsondata').append(text + '<br />');
        }
        SetText(json) {
            let text = JSON.stringify(json, undefined, 2);
            $('#jsondata').text(text); //
        }
    }

    ww.Browser = new Browser();

});
