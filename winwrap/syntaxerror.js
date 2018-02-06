define(function () {

    class SyntaxError {
        constructor(ui) {
            this.UI = ui;
            this.syntaxerror = null;
        }
        getSyntaxError() {
            let syntaxerror = this.syntaxerror.error;
            return this.syntaxerror;
        }
        setSyntaxError(syntaxerror) {
            this.syntaxerror = syntaxerror;
        }
    }

    ww.SyntaxError = SyntaxError;

});
