//FILE: decorate.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
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
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddResponseHandlers({
                break: response => {
                    this_.Breaks.BreakResponseHandler(response);
                    this_._display();
                },
                breaks: response => {
                    this_.Breaks.BreaksResponseHandler(response);
                    this_._display();
                },
                notify_errors: response => {
                    this_.SyntaxError.ErrorResponseHandler(response);
                    this_._display();
                },
                stack: response => {
                    this_.Stack.StateResponseHandler(response);
                    this_._display();
                },
                state: response => {
                    this_.Stack.StateResponseHandler(response);
                    this_._display();
                },
                syntax: response => {
                    this_.SyntaxError.ErrorResponseHandler(response);
                    this_._display();
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
            let this_ = this; // closure can't handle this in the lambdas below
            let breaks = this.Breaks.GetBreaks(target);
            breaks.forEach(abreak => {
                let decoration = this_._breakDecoration(abreak.line);
                decorations.push(decoration);
            });
            return decorations;
        }

        _pauseDecoration(target) {
            let decorations = [];
            let line = this.Stack.GetPauseLine(target);
            if (line !== null) {
                let decoration = {};
                decoration.range = new monaco.Range(line, 1, line, 1);
                decoration.options = { isWholeLine: true, 'className': 'myDebugPauseClass' };
                decorations.push(decoration);
            }
            return decorations;
        }

        /*decoration.options = { // works as hover
            className: 'myContentClass',
            hoverMessage: 'hover message'
        };*/

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
                    let position = { lineNumber: line, column: theError.offset+1 };
                    this.monacoEditor_.setPosition(position);
                    this.monacoEditor_.focus();
                }
                let syntaxMsg = syntaxError.GetMessage();
                this.channel_.SetStatusBarText(syntaxMsg);
            }
            syntaxError.ClearError();
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
