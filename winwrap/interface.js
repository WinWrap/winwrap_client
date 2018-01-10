var ww = ww || {};

// Objects responding to and controlling WinWrap Edit interface html elements
ww.InterfaceJS = function () {

    class Interface {
        constructor() {

        }
        Initialize() {
            ww.InputMacro.Initialize();
            ww.ButtonRun.Initialize();
            ww.ButtonPause.Initialize();
            ww.ButtonEnd.Initialize();
            ww.ButtonInto.Initialize();
            ww.ButtonOver.Initialize();
            ww.ButtonOut.Initialize();
            ww.ButtonNew.Initialize();
            ww.ButtonSave.Initialize();
            ww.ButtonWatch.Initialize();
            ww.WinWrapVersion.Initialize();
        }
        SetState(response) {
            ww.ButtonRun.Enabled(response.commands.run);
            ww.ButtonPause.Enabled(response.commands.pause);
            ww.ButtonEnd.Enabled(response.commands.end);
            ww.ButtonInto.Enabled(response.commands.into);
            ww.ButtonOver.Enabled(response.commands.over);
            ww.ButtonOut.Enabled(response.commands.out);
            ww.ButtonNew.Enabled(!response.macro_loaded);
            ww.ButtonSave.Enabled(true);
            ww.ButtonWatch.Enabled(true);
        }
    }

    ww.Interface = new Interface();

    class Button_Helper {
        constructor(buttonid, clickhandler) {
            this.button_ = $(buttonid);
            this.button_.click(clickhandler);
            this.Enabled(false);
        }
        Enabled(enable) {
            var html = this.button_.html();
            if (enable) {
                html = html.replace(' fa-inverse', '');
            } else if (html.indexOf(' fa-inverse') < 0) {
                html = html.replace('">', ' fa-inverse">');
            }
            this.button_.html(html);
        }
        IsEnabled() {
            return this.button_.html().indexOf(' fa-inverse') < 0;
        }
    }

    class ButtonSave {
        constructor() {
        }
        Initialize() {
            this.button_ = new Button_Helper("#buttonsave", () => {
                let code = ww.EditorCode.editor().getValue();
                let name = ww.InputMacro.Name;
                let newname = ww.InputMacro.GetValue();
                this.Save(code, name, newname);
            });
        }
        Save(code, name, newname) { // xxx don't need code - abstraction?
            let requests = [].concat(ww.CommitRebase.GetCommitRequest());
            requests.push({ command: "?write", target: name, new_name: newname });
            let result = ww.Ajax.SendProcess(requests);
            return result;
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
        /*as*ync UpdateSave(code, name, newname) { // xxx not tested
            let result = a*wait ww.Request.Send([
                { command: "?update", target: name, code: code },
                { command: "?write", target: name, new_name: newname }
            ]);
            return result;
        }*/
    }

    ww.ButtonSave = new ButtonSave();

    class ButtonRun {
        constructor() {
        }
        Initialize() {
            this.button_ = new Button_Helper("#buttonrun", () => {
                let requests = [
                    {
                        command: "?update", target: ww.InputMacro.GetValue(), code: ww.EditorCode.editor().getValue()
                    },
                    {
                        command: "run", target: ww.InputMacro.GetValue()
                    }
                ];
                ww.Ajax.SendProcess(requests);
            });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
    }

    ww.ButtonRun = new ButtonRun();

    class ButtonNew {
        constructor() {
        }
        Initialize() {
            this.button_ = new Button_Helper("#buttonnew", () => {
                this.ExecuteAsync(); // xxx
            });
        }
        async ExecuteAsync() {
            let request = {
                command: "?new", kind: "Macro",
                project: "", has_main: true, names: ["\\sample1.bas"] // xxx
            };
            let result = await new ww.AjaxPost().SendAsync(request, ["!new"]).catch(err => {
                console.log("interface.js ButtonNew ExecuteAsync !new ", err);
            });
            let newresponse = result.find(o => o.response === "!new");
            let requests = ww.InputMacro.ReadRequests(newresponse.name);
            result = await new ww.AjaxPost().SendAsync(requests, ["!read"]).catch(err => {
                console.log("interface.js ButtonNew ExecuteAsync !read ", err);
            });
            let readresponse = result.find(o => o.response === "!read");
            ww.CommitRebase.Read(readresponse);
            let stateresponse = result.find(o => o.response === "!state");
            ww.Interface.SetState(stateresponse);
            return result;
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
    }

    ww.ButtonNew = new ButtonNew();

    class ButtonInto {
        constructor() {
        }
        Initialize() {
            this.button_ = new Button_Helper("#buttoninto", () => {
                if (!ww.ButtonEnd.IsEnabled()) {
                    let requests = [
                        {
                            command: "?update", target: ww.InputMacro.GetValue(), code: ww.EditorCode.editor().getValue()
                        },
                        {
                            command: "into", target: ww.InputMacro.GetValue()
                        }
                    ];
                    ww.Ajax.SendProcess(requests);
                } else {
                    let request = { command: "into", target: ww.InputMacro.GetValue() };
                    ww.Ajax.SendProcess(request);
                }
            });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
    }

    ww.ButtonInto = new ButtonInto();

    class ButtonOver {
        constructor() {
        }
        Initialize() {
            this.button_ = new Button_Helper("#buttonover", () => {
                let request = { command: "over", target: ww.InputMacro.GetValue() };
                ww.Ajax.SendProcess(request);
            });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
    }

    ww.ButtonOver = new ButtonOver();

    class ButtonOut {
        constructor() {
        }
        Initialize() {
            this.button_ = new Button_Helper("#buttonout", () => {
                let request = { command: "out", target: ww.InputMacro.GetValue() };
                ww.Ajax.SendProcess(request);
            });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
    }

    ww.ButtonOut = new ButtonOut();

    class ButtonPause {
        constructor() {
        }
        Initialize() {
            this.button_ = new Button_Helper("#buttonpause", () => {
                let request = { command: "pause", target: ww.InputMacro.GetValue() };
                ww.Ajax.SendProcess(request);
            });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
    }

    ww.ButtonPause = new ButtonPause();

    class ButtonEnd {
        constructor() {
        }
        Initialize() {
            this.button_ = new Button_Helper("#buttonend", () => {
                let request = { command: "end", target: ww.InputMacro.GetValue() };
                ww.Ajax.SendProcess(request);
            });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
        IsEnabled() {
            return this.button_.IsEnabled();
        }
    }

    ww.ButtonEnd = new ButtonEnd();

    class ButtonWatch {
        constructor() {
        }
        Initialize() {
            this.button_ = new Button_Helper("#buttonwatch", () => { // xxx
                let immediateShowing = ww.EditorImmediate.showing();
                let watchShowing = ww.EditorWatch.showing();
                if (!immediateShowing && !watchShowing) {
                    ww.EditorImmediate.hide();
                    ww.EditorWatch.show();
                } else if (!immediateShowing && watchShowing) {
                    ww.EditorImmediate.show();
                    ww.EditorWatch.hide();
                } else if (immediateShowing && !watchShowing) {
                    ww.EditorImmediate.show();
                    ww.EditorWatch.show();
                } else if (immediateShowing && watchShowing) {
                    ww.EditorImmediate.hide();
                    ww.EditorWatch.hide();
                }
            });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
    }

    ww.ButtonWatch = new ButtonWatch();

    class WinWrapVersion {
        constructor() {
            this.button_ = $("#winwrapversion");
        }
        Initialize() {
            this.button_.click(() => {
                ww.Test001.Run();
            });
        }
        SetValue(version) {
            this.button_.text(version);
        }
    }

    ww.WinWrapVersion = new WinWrapVersion();

    class Browser {
        constructor() { }
        Log(json) {
            let text = JSON.stringify(json, undefined, 2);
            $("#jsondata").append(text + "<br />");
        }
    }

    ww.Browser = new Browser();

};
