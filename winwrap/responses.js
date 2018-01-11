var ww = ww || {};

(function () {

    class Responses { // singleton
        constructor() {
            this.Queue = [];
        }
        processResponse(response) {
            switch (response.response) { // each case => one requests
                //case "!attach": // anonymous fn from WinWrapVersion // response
                case "!auto":
                    ww.AutoAuto.Response = response; // for use by autocomplete/signaturehelp
                    break;
                case "!breaks": // response
                    ww.BreaksPause.setBreaks(response);
                    ww.DebugDecorate.display();
                    break;
                case "!commit":
                    ww.CommitRebase.CommitDone(response.revision);
                    break;
                case "!new": // response xxx (id is -1)
                    ww.Ajax.PushPendingRequest(ww.InputMacro.ReadRequests(response.name));
                    break;
                case "!opendialog": // anonymous fn in InputMacro // response
                    ww.InputMacro.macros_ = response.names.map(item => item.name); // xxx
                    break;
                case "!read": // response
                    ww.CommitRebase.Read(response);
                    ww.Ajax.PushPendingRequest({ command: "?state", target: response.files[0].name });
                    break;
                case "!state": // response
                    ww.Interface.SetState(response);
                    break;
                case "!watch": // response
                    let watchResults = response.results.map(item => {
                        let value = item.error !== undefined ? item.error : item.value;
                        return `${item.depth}: ${item.expr} -> ${value}`;
                    }).join("\n");
                    ww.EditorWatch.editor().setValue(watchResults);
                    break;
                default:
                    break;
            }
        }
        Process(responses) {
            if (responses !== undefined) { // xxx
                this.Queue = this.Queue.concat(responses);
            }
            if (this.Queue.length >= 1) {
                do {
                    let response = this.Queue.shift();
                    response.datetimeClient = new Date().toLocaleString();
                    this.processResponse(response); // "Expected ;" error forEach
                } while (this.Queue.length > 0);
            }
        }
    }

    ww.Responses = new Responses();

})();
