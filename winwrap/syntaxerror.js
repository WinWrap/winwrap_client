define(function () {

    class SyntaxError {
        constructor(ui) {
            this.UI = ui;
            this.response = {};
        }
        clearError() {
            this.response = {};
        }
        getResponse() {
            let response = this.response;
            return response;
        }
        setResponse(response) {
            this.response = response;
        }
        getError() {
            let response = this.response;
            let error;
            if (response.response !== undefined) {
                error = response.error; // can be undefined (no error)
            } else {
                error = null; // error value not valid
            }
            return error;
        }
        getMessage() {
            /*alert(notification.error.macro_name + '@' + notification.error.line_num + ': ' +
    notification.error.line + '\n' + notification.error.desc);*/
            let response = this.response;
            let msg = "";
            switch (response.response) {
                case "!syntax":
                    if (response.okay) {
                        msg = "No syntax errors.";
                    } else {
                        // will get !notify_error ?
                        msg = _makeMessage(response.error);
                    }
                    break;
                case "!notify_errors":
                    let error = response.error;
                    msg = _makeMessage(response.error);
                    break;
                default:
                    break;
            }
            return msg;
        }
        _makeMessage(theerror) {
            let msg = "";
            //errormsg = error.macro_name + '@' + error.line_num + ': ' + error.line + '\n' + error.desc;
            msg = `${theerror.macro_name}@${theerror.line_num}:${theerror.line} ${theerror.desc}`
            return msg;
        }
    }

    ww.SyntaxError = SyntaxError;

});
