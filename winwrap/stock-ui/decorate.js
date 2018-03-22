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
        constructor(ui, monacoEditor) {
            this.UI = ui;
            this.monacoEditor_ = monacoEditor;
            this.oldDecorations = '';
            this.Breaks = new ww.Breaks(this);
            this.Stack = new ww.Stack(this);
            this.SyntaxError = new ww.SyntaxError(this);
        }
        _breakDecoration(line) {
            let decoration = {};
            decoration.range = new monaco.Range(line, 1, line, 1);
            decoration.options = { isWholeLine: true, 'glyphMarginClassName': 'myGlyphMarginClass' };
            return decoration;
        }
        _breaksDecorations(target) {
            let decorations = [];
            let this_ = this;
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
                this.UI.StatusBar.element_.text(`Error ${syntaxMsg}`);
            }
            syntaxError.ClearError();
            return decorations;
        }
        Display() {
            let target = this.UI.Channel.CommitRebase.Name();
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
