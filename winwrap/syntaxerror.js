define(function () {

    class SyntaxError {
        constructor(ui) {
            this.UI = ui;
            this.syntaxerror = undefined;
        }
        getSyntaxError() {
            return this.syntaxerror;
        }
        setSyntaxError(syntaxerror) {
            this.syntaxerror = syntaxerror;
        }
    }

    ww.SyntaxError = SyntaxError;

});
