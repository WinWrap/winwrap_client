var ww = ww || {};

(function () {

    class Notifications { // singleton
        constructor() {
            this.Queue = [];
        }
        processNotification(notification) {
            switch (notification.response.toLowerCase()) { // each case => one requests
                case "!break": // notification
                    ww.BreaksPause.setBreak(notification);
                    ww.DebugDecorate.display();
                    break;
                case "!notify_begin": // notification
                    ww.EditorImmediate.show();
                    ww.Interface.SetState(notification);
                    break;
                case "!notify_debugclear": // notification
                    // need a ww.EditorImmediate method to clear the immediate text
                    break;
                case "!notify_debugprint": // notification
                    ww.EditorImmediate.appendText(notification.text);
                    ww.EditorImmediate.scrollToBottom();
                    /*setTimeout(function () {
                        ww.EditorImmediate.appendText(notification.text);
                        ww.EditorImmediate.scrollToBottom();
                    }, 100);*/ // xxx
                    break;
                case "!notify_end": // notification
                    ww.EditorImmediate.hide();
                    ww.Interface.SetState(notification);
                    break;
                case "!notify_macrobegin": // notification
                    break;
                case "!notify_macroend": // notification
                    break;
                case "!notify_pause": // notification
                    if (ww.InputMacro.GetValue() !== notification.file_name) {
                        ww.Ajax.PushPendingRequest({ command: "?read", target: notification.file_name });
                    }
                    let watches = ww.EditorWatch.editor().getValue().trim().split(/[\r]?\n/).filter(el => { return el !== ""; });
                    if (watches.length >= 1) { // xxx
                        ww.Ajax.PushPendingRequest({ command: "?watch", watches: watches });
                    }
                    ww.Interface.SetState(notification);
                    break;
                case "!notify_resume": // notification
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
