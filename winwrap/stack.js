define(function () {

    class Stack {
        constructor(ui) {
            this.UI = ui;
            this.breaks = [];
        }
        getPauseLine(name) {
            let line = null;
            if (this.stack.length > 0) {
                let stack0 = this.stack[0];
                if (stack0.name === name) {
                    line = stack0.linenum;
                }
            }
            return line;
        }
        setStack(notification) {
            if (notification.response !== '!state') {
                if (notification.stack !== undefined) {
                    this.stack = notification.stack;
                } else {
                    this.stack = [];
                }
                this.UI.DebugDecorate.display();
            }
        }
    }

    ww.Stack = Stack;

});
