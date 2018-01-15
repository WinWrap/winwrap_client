define(function () {
    class Notifications {
        constructor(basic) {
            this.Basic = basic;
        }
        Process(notification) {
            switch (notification.response) { // each case => one requests
                case "!break": // notification
                    this.Basic.BreaksPause.setBreak(notification);
                    this.Basic.DebugDecorate.display();
                    break;
                case "!notify_begin": // notification
                    this.Basic.EditorImmediate.show();
                    this.Basic.Interface.SetState(notification);
                    break;
                case "!notify_debugclear": // notification
                    // need a this.Basic.EditorImmediate method to clear the immediate text
                    break;
                case "!notify_debugprint": // notification
                    this.Basic.EditorImmediate.appendText(notification.text);
                    this.Basic.EditorImmediate.scrollToBottom();
                    /*setTimeout(function () {
                        this.Basic.EditorImmediate.appendText(notification.text);
                        this.Basic.EditorImmediate.scrollToBottom();
                    }, 100);*/ // xxx
                    break;
                case "!notify_end": // notification
                    this.Basic.EditorImmediate.hide();
                    this.Basic.Interface.SetState(notification);
                    break;
                case "!notify_errorlog": // notification
                    break;
                case "!notify_errors": // notification
                    alert(notification.error.macro_name + "@" + notification.error.line_num + ": " +
                        notification.error.line + "\n" + notification.error.desc);
                    if (this.Basic.CommitRebase.Name !== notification.error.macro_name) {
                        this.Basic.PushPendingRequest({ command: "?read", target: notification.error.macro_name });
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
                    if (this.Basic.CommitRebase.Name !== notification.file_name) {
                        this.Basic.PushPendingRequest({ command: "?read", target: notification.file_name });
                    }
                    let watches = this.Basic.EditorWatch.editor().getValue().trim().split(/[\r]?\n/).filter(el => { return el !== ""; });
                    if (watches.length >= 1) { // xxx
                        this.Basic.PushPendingRequest({ command: "?watch", watches: watches });
                    }
                    this.Basic.Interface.SetState(notification);
                    break;
                case "!notify_resume": // notification
                    this.Basic.Interface.SetState(notification);
                    break;
                case "!rebase": // notification
                    this.Basic.CommitRebase.Rebase(notification);
                    break;
                default:
                    break;
            }
        }
    }

    ww.Notifications = Notifications;

});
