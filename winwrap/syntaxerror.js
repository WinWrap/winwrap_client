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
        getErrorMessage() {
            /*alert(notification.error.macro_name + '@' + notification.error.line_num + ': ' +
    notification.error.line + '\n' + notification.error.desc);*/
            let error = this.syntaxerror;
            let errormsg = "No syntax errors.";
            if (this.syntaxerror !== undefined) {
                //errormsg = error.macro_name + '@' + error.line_num + ': ' + error.line + '\n' + error.desc;
                errormsg = `${error.macro_name}@${error.line_num}:${error.line} ${error.desc}`
            }
            return errormsg;
        }
    }

    ww.SyntaxError = SyntaxError;

});
