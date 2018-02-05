define(function () {

    class SyntaxError {
        constructor(ui) {
            this.UI = ui;
            this.syntaxerror = [];
        }
        getSyntaxError(target) {
            let syntaxerror = this.syntaxerror;
            breaks = syntaxerror.filter(el => el.target === target);
            return syntaxerror;
        }
        setSyntaxError(notification) {
            this.syntaxerror = notification;
            this.UI.DebugDecorate.display();
        }
    }

    ww.SyntaxError = SyntaxError;

});
