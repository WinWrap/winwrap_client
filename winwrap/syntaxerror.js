define(function () {

    class SyntaxError {
        constructor(ui) {
            this.UI = ui;
            this.syntax = [];
        }
        getSyntax(target) {
            let syntax = this.syntax;
            breaks = syntax.filter(el => el.target === target);
            return syntax;
        }
        setSyntax(notification) {
            this.syntax = notification;
            this.UI.DebugDecorate.display();
        }
    }

    ww.SyntaxError = SyntaxError;

});
