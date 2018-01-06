var ww = ww || {};

// Objects responding to and controlling WinWrap Edit interface html elements
ww.InterfaceJS = function () {

    class Interface {
        constructor() {

        }
        Initialize() {
            ww.InputMacro.Initialize();
            ww.ButtonSave.Initialize();
            ww.ButtonRun.Initialize();
            ww.ButtonNew.Initialize();
            ww.ButtonInto.Initialize();
            ww.ButtonOver.Initialize();
            ww.ButtonOut.Initialize();
            ww.ButtonEnd.Initialize();
            ww.ButtonWatch.Initialize();
            ww.WinWrapVersion.Initialize();
        }
    }

    ww.Interface = new Interface();

    class ButtonSave {
        constructor() {
            this.button_ = $("#buttonsave");
        }
        Initialize() {
            this.button_.click(() => {
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
        SetValue(text) {
            $("#buttonrun").text(text);
            /*setTimeout(function () {
                $("#buttonrun").text(text);
            }, 100);*/ // xxx
        }
        Initialize() {
            $("#buttonrun").click(() => {
                if ($("#buttonrun").text() === "Run") { // xxx use commit
                    let requests = [
                        {
                            command: "?update", target: ww.InputMacro.GetValue(), code: ww.EditorCode.editor().getValue()
                        },
                        {
                            command: "run", target: ww.InputMacro.GetValue()
                        }
                    ];
                    ww.Ajax.SendProcess(requests);
                } else {
                    let request = { command: "pause" };
                    ww.Ajax.SendProcess(request);
                }
            });
        }
    }

    ww.ButtonRun = new ButtonRun();

    class ButtonNew {
        constructor() {

        }
        Initialize() {
            $("#buttonnew").click(() => {
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
            return result;
        }
    }

    ww.ButtonNew = new ButtonNew();

    class ButtonInto {
        constructor() {

        }
        Initialize() {
            $("#buttoninto").click(() => {
                let request = { command: "into", target: ww.InputMacro.GetValue() };
                ww.Ajax.SendProcess(request);
            });
        }
    }

    ww.ButtonInto = new ButtonInto();

    class ButtonOver {
        constructor() {

        }
        Initialize() {
            $("#buttonover").click(() => {
                let request = { command: "over", target: ww.InputMacro.GetValue() };
                ww.Ajax.SendProcess(request);
            });
        }
    }

    ww.ButtonOver = new ButtonOver();

    class ButtonOut {
        constructor() {

        }
        Initialize() {
            $("#buttonout").click(() => {
                let request = { command: "out", target: ww.InputMacro.GetValue() };
                ww.Ajax.SendProcess(request);
            });
        }
    }

    ww.ButtonOut = new ButtonOut();

    class ButtonEnd {
        constructor() {

        }
        Initialize() {
            $("#buttonend").click(() => {
                let request = { command: "end", target: ww.InputMacro.GetValue() };
                ww.Ajax.SendProcess(request);
            });
        }
    }

    ww.ButtonEnd = new ButtonEnd();

    class ButtonWatch {
        constructor() {

        }
        Initialize() {
            $("#buttonwatch").click(() => { // xxx
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
    }

    ww.ButtonWatch = new ButtonWatch();

    class WinWrapVersion {
        constructor() { }
        Initialize() {
            $("#winwrapversion").click(() => {
                ww.Test001.Run();
            });
        }
        SetValue(version) {
            $("#winwrapversion").text(version);
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
