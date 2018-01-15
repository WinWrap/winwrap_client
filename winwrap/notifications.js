define(function () {

    class Notifications { // singleton
        constructor() {
        }
        ProcessNotification(notification) {
            switch (notification.response) { // each case => one requests
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
                case "!notify_errorlog": // notification
                    break;
                case "!notify_errors": // notification
                    alert(notification.error.macro_name + "@" + notification.error.line_num + ": " +
                        notification.error.line + "\n" + notification.error.desc);
                    if (ww.CommitRebase.Name !== notification.error.macro_name) {
                        ww.Ajax.PushPendingRequest({ command: "?read", target: notification.error.macro_name });
                    }
                    // should highlight the error line in red and scroll to it
                    // notification.error.line_num
                    // notification.error.offset (index into the line where the error occurred, -1 for runtime error)
                    break;
                case "!notify_macrobegin": // notification
                    break;
                case "!notify_macroend": // notification
                    break;
                case "!notify_pause": // notification
                    if (ww.CommitRebase.Name !== notification.file_name) {
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
    }

    ww.Notifications = new Notifications();

});
