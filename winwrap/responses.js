define(function () {
    class Responses {
        constructor(basic) {
            this.Basic = basic;
        }
        Process(response) {
            switch (response.response) { // each case => one requests
                //case "!attach": // anonymous fn from WinWrapVersion // response
                case "!breaks": // response
                    this.Basic.BreaksPause.setBreaks(response);
                    break;
                case "!commit":
                    this.Basic.CommitRebase.CommitDone(response.revision);
                    break;
                case "!new": // response
                    this.Basic.PushPendingRequest({ command: "?read", target: response.name });
                    break;
                case "!opendialog": // response
                    this.Basic.Interface.InputMacro.SetValues(response.names.map(item => item.name));
                    break;
                case "!read": // response
                    // only read the first file
                    let file = response.files[0];
                    this.Basic.Interface.InputMacro.SetValue(file.name);
                    this.Basic.CommitRebase.Read(file);
                    this.Basic.PushPendingRequest({ command: "?breaks", target: file.name });
                    this.Basic.PushPendingRequest({ command: "?state", target: file.name });
                    break;
                case "!state": // response
                    this.Basic.Interface.SetState(response);
                    break;
                case "!stack": // response
                    this.Basic.BreaksPause.setPause(response);
                    break;
                case "!watch": // response
                    let watchResults = response.results.map(item => {
                        let value = item.error !== undefined ? item.error : item.value;
                        return `${item.depth}: ${item.expr} -> ${value}`;
                    }).join("\n");
                    this.Basic.EditorWatch.editor().setValue(watchResults);
                    break;
                case "!write": // response
                    break;
                default:
                    break;
            }
        }
    }

    ww.Responses = Responses;

});
