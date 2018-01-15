define(function () {

    class Interface {
        constructor(basic) {
            this.Basic = basic;
        }
        Initialize() {
            this.ButtonNew = new ButtonNew(this.Basic);
            this.InputMacro = new InputMacro(this.Basic);
            this.ButtonSave = new ButtonSave(this.Basic);
            this.ButtonRun = new ButtonRun(this.Basic);
            this.ButtonPause = new ButtonPause(this.Basic);
            this.ButtonEnd = new ButtonEnd(this.Basic);
            this.ButtonInto = new ButtonInto(this.Basic);
            this.ButtonOver = new ButtonOver(this.Basic);
            this.ButtonOut = new ButtonOut(this.Basic);
            this.ButtonWatch = new ButtonWatch(this.Basic);
            this.WinWrapVersion = new WinWrapVersion(this.Basic);
        }
        SetState(response) {
            // editor should be
            // ww.EditorCode.editor."readonly" = response.commands.run || response.commands.pause;
            this.ButtonNew.Enabled(!response.macro_loaded);
            this.InputMacro.Enabled(true);
            this.ButtonSave.Enabled(true);
            this.ButtonRun.Enabled(response.commands.run);
            this.ButtonPause.Enabled(response.commands.pause);
            this.ButtonEnd.Enabled(response.commands.end);
            this.ButtonInto.Enabled(response.commands.into);
            this.ButtonOver.Enabled(response.commands.over);
            this.ButtonOut.Enabled(response.commands.out);
            this.ButtonWatch.Enabled(true);
            // update current line
            this.Basic.BreaksPause.setPause(response);
        }
    }

    ww.Interface = Interface;

    class Button_Helper {
        constructor(button, clickhandler) {
            this.button_ = button;
            this.button_.button(); // make sure the button is initialized
            this.button_.click(clickhandler);
            this.Enabled(false);
        }
        Enabled(enable) {
            this.enabled_ = enable;
            this.button_.button(enable ? "enable" : "disable");
        }
        IsEnabled() {
            return this.enabled_;
        }
    }

    class ButtonNew {
        constructor(basic) {
            this.button_ = new Button_Helper(basic.LocateElement("new-button"),
                () => {
                    basic.PushPendingRequest({ command: "?new", kind: "Macro", has_main: true, names: [] });
                });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
    }

    class InputMacro {
        constructor(basic) {
            this.Basic = basic;
            this.macros_ = []; // xxx Macros
            this.$_ = basic.LocateElement("files");
            let inputMacro = this; // closure can't handle this in the lambdas below
            this.$_.autocomplete({
                source: function (request, response) {
                    let term = $.ui.autocomplete.escapeRegex(request.term);
                    //console.log(term);
                    var matcher = new RegExp(`^.*${term}.*$`, "i");
                    response($.grep(inputMacro.macros_, function (item) { // xxx
                        return matcher.test(item);
                    }));
                }
            });
            this.$_.on("autocompleteselect", function (event, ui) {
                inputMacro.Basic.PushPendingRequest({ command: "?read", target: ui.item.value });
            });
        }
        Enabled(enable) {
            // to be written - 1/15/18
        }
        GetValue() {
            return this.$_.val();
        }
        SetValue(value) {
            this.$_.val(value);
        }
        SetValues(values) {
            this.macros_ = values;
            if (values.find(item => item === "\\Sample1.bas")) {
                this.Basic.PushPendingRequest({ command: "?read", target: "\\Sample1.bas" });
            }
            else {
                this.Basic.PushPendingRequest({ command: "?new", names: [] });
            }
        }
    }

    class ButtonSave {
        constructor(basic) {
            this.button_ = new Button_Helper(basic.LocateElement("save-button"),
                () => {
                    let code = basic.EditorCode.editor().getValue();
                    let name = basic.CommitRebase.Name;
                    let newname = basic.Interface.InputMacro.GetValue();
                    basic.PushPendingRequest(basic.CommitRebase.GetCommitRequest());
                    basic.PushPendingRequest({ command: "?write", target: name, new_name: newname });
                });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
    }

    class ButtonRun {
        constructor(basic) {
            this.button_ = new Button_Helper(basic.LocateElement("run-button"),
                () => {
                    basic.PushPendingRequest(basic.CommitRebase.GetCommitRequest());
                    basic.PushPendingRequest({ command: "run", target: basic.CommitRebase.Name });
                });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
    }

    class ButtonInto {
        constructor(basic) {
            this.button_ = new Button_Helper(basic.LocateElement("into-button"),
                () => {
                    basic.PushPendingRequest(basic.CommitRebase.GetCommitRequest());
                    basic.PushPendingRequest({ command: "into", target: basic.CommitRebase.Name });
                });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
    }

    class ButtonOver {
        constructor(basic) {
            this.button_ = new Button_Helper(basic.LocateElement("over-button"),
                () => {
                    basic.PushPendingRequest(basic.CommitRebase.GetCommitRequest());
                    basic.PushPendingRequest({ command: "over", target: basic.CommitRebase.Name });
                });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
    }

    class ButtonOut {
        constructor(basic) {
            this.button_ = new Button_Helper(basic.LocateElement("out-button"),
                () => {
                    basic.PushPendingRequest({ command: "out", target: basic.CommitRebase.Name });
                });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
    }

    class ButtonPause {
        constructor(basic) {
            this.button_ = new Button_Helper(basic.LocateElement("pause-button"),
                () => {
                    basic.PushPendingRequest({ command: "pause", target: basic.CommitRebase.Name });
                });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
    }

    class ButtonEnd {
        constructor(basic) {
            this.button_ = new Button_Helper(basic.LocateElement("end-button"),
                () => {
                    basic.PushPendingRequest({ command: "end", target: basic.CommitRebase.Name });
                });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
        IsEnabled() {
            return this.button_.IsEnabled();
        }
    }

    class ButtonWatch {
        constructor(basic) {
            this.button_ = new Button_Helper(basic.LocateElement("watch-button"),
                () => { // xxx
                    let immediateShowing = basic.EditorImmediate.showing();
                    let watchShowing = basic.EditorWatch.showing();
                    if (!immediateShowing && !watchShowing) {
                        basic.EditorImmediate.hide();
                        basic.EditorWatch.show();
                    } else if (!immediateShowing && watchShowing) {
                        basic.EditorImmediate.show();
                        basic.EditorWatch.hide();
                    } else if (immediateShowing && !watchShowing) {
                        basic.EditorImmediate.show();
                        basic.EditorWatch.show();
                    } else if (immediateShowing && watchShowing) {
                        basic.EditorImmediate.hide();
                        basic.EditorWatch.hide();
                    }
                });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
    }

    class WinWrapVersion {
        constructor(basic) {
            this.Basic = basic;
            this.button_ = basic.LocateElement("version");
            this.button_.click(() => {
                let test001 = new Test001(this.Basic);
                test001.Run();
            });
        }
        SetValue(version) {
            this.button_.text(version);
        }
    }

    class Browser {
        constructor() { }
        Log(json) {
            let text = JSON.stringify(json, undefined, 2);
            $("#jsondata").append(text + "<br />");
        }
    }

    ww.Browser = new Browser();

});
