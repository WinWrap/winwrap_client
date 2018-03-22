//FILE: syntaxerror.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class SyntaxError {
        constructor(decorate) {
            this.Decorate = decorate;
            this.response_ = {};
        }
        ClearError() {
            this.response_ = {};
        }
        GetError() {
            let response = this.response_;
            let error;
            if (response.response !== undefined) {
                error = response.error; // can be undefined (no error)
            } else {
                error = null; // error value not valid
            }
            return error;
        }
        GetMessage() {
            /*alert(notification.error.macro_name + '@' + notification.error.line_num + ': ' +
    notification.error.line + '\n' + notification.error.desc);*/
            let response = this.response_;
            let msg = "";
            switch (response.response) {
                case "!syntax":
                    if (response.okay) {
                        msg = "No syntax errors.";
                    } else {
                        // will get !notify_error ?
                        msg = this._makeMessage(response.error);
                    }
                    break;
                case "!notify_errors":
                    msg = this._makeMessage(response.error);
                    break;
                default:
                    break;
            }
            return msg;
        }
        SetError(response) {
            this.response_ = response;
            this.Decorate.Display();
        }
        _makeMessage(theerror) {
            let msg = "";
            //errormsg = error.macro_name + '@' + error.line_num + ': ' + error.line + '\n' + error.desc;
            msg = `${theerror.macro_name}@${theerror.line_num}.${theerror.offset}: \"${theerror.line}\" ${theerror.desc}`
            msg = msg.replace(/\s\s+/g, ' ');
            return msg;
        }
    }

    ww.SyntaxError = SyntaxError;

});
