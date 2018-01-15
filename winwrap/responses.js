define(function () {

    class Responses { // singleton
        constructor() {
        }
        ProcessResponse(response) {
            switch (response.response) { // each case => one requests
                //case "!attach": // anonymous fn from WinWrapVersion // response
                case "!breaks": // response
                    ww.BreaksPause.setBreaks(response);
                    break;
                case "!commit":
                    ww.CommitRebase.CommitDone(response.revision);
                    break;
                case "!new": // response
                    ww.Ajax.PushPendingRequest({ command: "?read", target: response.name });
                    break;
                case "!opendialog": // response
                    ww.InputMacro.SetValues(response.names.map(item => item.name));
                    break;
                case "!read": // response
                    // only read the first file
                    let file = response.files[0];
                    ww.InputMacro.SetValue(file.name);
                    ww.CommitRebase.Read(file);
                    ww.Ajax.PushPendingRequest({ command: "?breaks", target: file.name });
                    ww.Ajax.PushPendingRequest({ command: "?state", target: file.name });
                    break;
                case "!state": // response
                    ww.Interface.SetState(response);
                    break;
                case "!stack": // response
                    ww.BreaksPause.setPause(response);
                    break;
                case "!watch": // response
                    let watchResults = response.results.map(item => {
                        let value = item.error !== undefined ? item.error : item.value;
                        return `${item.depth}: ${item.expr} -> ${value}`;
                    }).join("\n");
                    ww.EditorWatch.editor().setValue(watchResults);
                    break;
                case "!write": // response
                    break;
                default:
                    break;
            }
        }
    }

    ww.Responses = new Responses();

});
