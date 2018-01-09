var ww = ww || {};

(function () {

    class Notifications { // singleton
        constructor() {
            this.Queue = [];
        }
        processNotification(notification) {
            switch (notification.response) { // each case => one requests
                case "!break": // notification
                    ww.BreaksPause.setBreak(notification); // xxx
                    ww.DebugDecorate.display();
                    break;
                case "!notify_Begin": // a notify -1 // notification
                    //ww.EditorImmediate.show(); // moved to !nofity_MacroBegin
                    //ww.ButtonRun.SetValue("Pause");
                    this.NeedState();
                    break;
                case "!notify_debugprint": // notification
                    ww.EditorImmediate.appendText(notification.text);
                    ww.EditorImmediate.scrollToBottom();
                    /*setTimeout(function () {
                        ww.EditorImmediate.appendText(notification.text);
                        ww.EditorImmediate.scrollToBottom();
                    }, 100);*/ // xxx
                    break;
                case "!notify_End": // notification
                    ww.EditorImmediate.hide();
                    this.NeedState();
                    break;
                case "!notify_MacroBegin": // notification
                    ww.EditorImmediate.show();
                    break;
                case "!notify_MacroEnd": // notification
                    ww.BreaksPause.clearPause();
                    ww.DebugDecorate.display();
                    break;
                case "!notify_Pause": // notification - causes request/response(s) xxx
                    ww.BreaksPause.setPause(notification);
                    ww.DebugDecorate.display();
                    let name = notification.stack[0].name;
                    if (ww.InputMacro.GetValue() !== name) {
                        ww.Ajax.PushPendingRequest(ww.InputMacro.ReadRequests(name));
                    }
                    let watches = ww.EditorWatch.editor().getValue().trim().split(/[\r]?\n/).filter(el => { return el !== ""; });
                    if (watches.length >= 1) { // xxx
                        let request = { command: "?watch", watches: watches };
                        ww.Ajax.PushPendingRequest(request);
                    }
                    this.NeedState();
                    break;
                case "!notify_Resume": // notification
                    ww.BreaksPause.clearPause();
                    ww.DebugDecorate.display();
                    this.NeedState();
                    break;
                case "!rebase": // notification
                    ww.CommitRebase.Rebase(notification);
                    break;
                default:
                    break;
            }
        }
        Process(notifications) {
            if (notifications !== undefined) { // xxx
                this.Queue = this.Queue.concat(notifications);
            }
            if (this.Queue.length >= 1) {
                do {
                    let notification = this.Queue.shift();
                    notification.datetimeClient = new Date().toLocaleString();
                    this.processNotification(notification); // "Expected ;" error forEach
                } while (this.Queue.length > 0);
            }
        }
        NeedState() {
            let request = { command: "?state", target: ww.InputMacro.GetValue() };
            ww.Ajax.PushPendingRequest(request);
        }
    }

    ww.Notifications = new Notifications();

})();
