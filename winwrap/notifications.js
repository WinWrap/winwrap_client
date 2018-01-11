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
                case "!notify_Begin": // notification
                    ww.EditorImmediate.show();
                    ww.Interface.SetState(notification);
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
                    ww.BreaksPause.clearPause();
                    ww.EditorImmediate.hide();
                    ww.Interface.SetState(notification);
                    break;
                case "!notify_MacroBegin": // notification
                    break;
                case "!notify_MacroEnd": // notification
                    break;
                case "!notify_Pause": // notification
                    ww.BreaksPause.setPause(notification);
                    ww.DebugDecorate.display();
                    let name = notification.stack[0].name;
                    if (ww.InputMacro.GetValue() !== name) {
                        ww.Ajax.PushPendingRequest(ww.InputMacro.ReadRequests(name));
                    }
                    let watches = ww.EditorWatch.editor().getValue().trim().split(/[\r]?\n/).filter(el => { return el !== ""; });
                    if (watches.length >= 1) { // xxx
                        ww.Ajax.PushPendingRequest({ command: "?watch", watches: watches });
                    }
                    ww.Interface.SetState(notification);
                    break;
                case "!notify_Resume": // notification
                    ww.BreaksPause.clearPause();
                    ww.DebugDecorate.display();
                    ww.Interface.SetState(notification);
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
    }

    ww.Notifications = new Notifications();

})();
