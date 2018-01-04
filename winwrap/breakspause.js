var ww = ww || {};

(function () {

    class BreaksPause {
        constructor() {
            this.breaks = [];
            this.pause = null;
        }
        getBreaks(target) {
            let breaks = this.breaks;
            breaks = breaks.filter(el => {
                return el.target === target;
            });
            return breaks;
        }
        /*getPause() {
            return this.pause;
        }*/
        getPauseLine(name) {
            let line = null;
            if (this.pause !== null) {
                let stack0 = this.pause.stack[0];
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
            let breaks = this.breaks;
            notification.breaks.forEach(macroBreaks => {
                breaks = breaks.filter(el => {
                    return el.target !== notification.target;
                });
                macroBreaks.lines.forEach(line => {
                    breaks.push({ "target": macroBreaks.name, "line": line });
                });
            });
            this.breaks = breaks;
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
            this.pause = notification;
        }
        clearPause() {
            this.pause = null;
        }
    }

    ww.BreaksPause = new BreaksPause();

})();
