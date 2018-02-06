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
        getSyntaxMessage() {
            /*alert(notification.error.macro_name + '@' + notification.error.line_num + ': ' +
    notification.error.line + '\n' + notification.error.desc);*/
        }
    }

    ww.SyntaxError = SyntaxError;

});
