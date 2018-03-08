define(function () {

    class Breaks {
        constructor(ui) {
            this.UI = ui;
            this.breaks = [];
        }
        getBreaks(target) {
            let breaks = this.breaks;
            breaks = breaks.filter(el => el.target === target);
            return breaks;
        }
        setBreak(notification) {
            let breaks = this.breaks;
            breaks = breaks.filter(el => el.line !== notification.line || el.target !== notification.target);
            if (notification.on === true) {
                breaks.push({ 'target': notification.target, 'line': notification.line });
            }
            this.breaks = breaks;
        }
        setBreaks(notification) {
            let breaks = [];
            let newBreaks = notification.breaks;
            if (newBreaks !== undefined) {
                newBreaks.forEach(macroBreaks => {
                    macroBreaks.lines.forEach(line => {
                        breaks.push({ 'target': macroBreaks.name, 'line': line });
                    });
                });
            }
            this.breaks = breaks;
            this.UI.Decorate.display();
        }
        isBreak(macro, aline) {
            let breaks = this.breaks;
            let abreak = breaks.find(el => {
                let match = el.target === macro && el.line === aline;
                return match;
            });
            return abreak !== undefined;
        }
    }

    ww.Breaks = Breaks;

});
