define(function () {

    class BreaksPause {
        constructor() {
            this.breaks = [];
            this.stack = [];
        }
        getBreaks(target) {
            let breaks = this.breaks;
            breaks = breaks.filter(el => {
                return el.target === target;
            });
            return breaks;
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
        setBreak(notification) {
            let breaks = this.breaks;
            breaks = breaks.filter(el => {
                return el.line !== notification.line || el.target !== notification.target;
            });
            if (notification.on === true) {
                breaks.push({ "target": notification.target, "line": notification.line });
            }
            this.breaks = breaks;
        }
        setBreaks(notification) {
            let breaks = [];
            let newBreaks = notification.breaks;
            if (newBreaks !== undefined) {
                newBreaks.forEach(macroBreaks => {
                    macroBreaks.lines.forEach(line => {
                        breaks.push({ "target": macroBreaks.name, "line": line });
                    });
                });
            }
            this.breaks = breaks;
            ww.DebugDecorate.display();
        }
        isBreak(macro, aline) {
            let breaks = this.breaks;
            let abreak = breaks.find(el => {
                let match = el.target === macro && el.line === aline;
                return match;
            });
            return abreak !== undefined;
        }
        setPause(notification) {
            if (notification.response !== "!state") {
                if (notification.stack !== undefined) {
                    this.stack = notification.stack;
                } else {
                    this.stack = [];
                }
                ww.DebugDecorate.display();
            }
        }
    }

    ww.BreaksPause = new BreaksPause();

});
