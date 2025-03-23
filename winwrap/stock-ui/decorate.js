//FILE: decorate.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2020 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.itextmodelwithdecorations.html
    // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.imodeldeltadecoration.html
    class Decorate {

        constructor(channel, monacoEditor) {
            this.channel_ = channel;
            this.monacoEditor_ = monacoEditor;
            this.oldDecorations = '';
            this.Breaks = new ww.Breaks(channel);
            this.Stack = new ww.Stack(channel);
            this.SyntaxError = new ww.SyntaxError(channel);
            channel.AddResponseHandlers({
                break: response => {
                    this.Breaks.BreakResponseHandler(response);
                    this._display();
                },
                breaks: response => {
                    this.Breaks.BreaksResponseHandler(response);
                    this._display();
                },
                notify_errors: response => {
                    this.SyntaxError.ErrorResponseHandler(response);
                    this._display();
                },
                notify_end: response => {
                    this.SyntaxError.ClearError();
                },
                notify_resume: response => {
                    this.SyntaxError.ClearError();
                },
                stack: response => {
                    this.Stack.StateResponseHandler(response);
                    this._display();
                },
                state: response => {
                    this.Stack.StateResponseHandler(response);
                    this._display();
                },
                syntax: response => {
                    this.SyntaxError.ErrorResponseHandler(response);
                    this._display();
                },
                _clear_error: response => {
                    this.SyntaxError.ClearError();
                }
            });
        }

        _breakDecoration(line) {
            let decoration = {};
            decoration.range = new monaco.Range(line, 1, line, 1);
            decoration.options = { isWholeLine: true, 'glyphMarginClassName': 'myGlyphMarginClass' };
            return decoration;
        }

        _breaksDecorations(target) {
            let decorations = [];
            let breaks = this.Breaks.GetBreaks(target);
            breaks.forEach(abreak => {
                let decoration = this._breakDecoration(abreak.line);
                decorations.push(decoration);
            });
            return decorations;
        }

        _pauseDecoration(target) {
            let decorations = [];
            let line = this.Stack.GetPauseLine(target);
            let theError = this.SyntaxError.GetError();
            if (line !== null && (theError === null || theError === undefined || theError.line_num !== line)) {
                let decoration = {};
                decoration.range = new monaco.Range(line, 1, line, 1);
                decoration.options = { isWholeLine: true, 'className': 'myDebugPauseClass' };
                decorations.push(decoration);
            }
            return decorations;
        }

        _errorDecoration() {
            let decorations = [];
            let syntaxError = this.SyntaxError;
            let theError = syntaxError.GetError();
            if (theError !== null) {
                if (theError !== undefined) {
                    let line = theError.line_num;
                    let decoration = {};
                    decoration.range = new monaco.Range(line, 1, line, 1);
                    decoration.options = { isWholeLine: true, className: 'myErrorClass' };
                    decorations.push(decoration);
                    let position = { lineNumber: line, column: theError.offset + 1 };
                    this.monacoEditor_.setPosition(position);
                    this.monacoEditor_.focus();
                }
                let syntaxMsg = syntaxError.GetMessage();
                this.channel_.SetStatusBarText(syntaxMsg);
            } else {
                syntaxError.ClearError();
            }
            return decorations;
        }

        _display() {
            let target = this.channel_.CommitRebase.Name();
            if (target !== null) {
                let decorations = [];
                decorations.push(...this._breaksDecorations(target));
                decorations.push(...this._pauseDecoration(target));
                decorations.push(...this._errorDecoration());
                if (decorations.length >= 1) {
                    this.oldDecorations = this.monacoEditor_.deltaDecorations(this.oldDecorations, decorations);
                } else {
                    this.oldDecorations = this.monacoEditor_.deltaDecorations(this.oldDecorations,
                        [{ range: new monaco.Range(1, 1, 1, 1), options: {} }]);
                }
            }
        }
    }

    ww.Decorate = Decorate;

});
