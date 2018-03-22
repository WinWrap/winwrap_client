//FILE: monacoeditor.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define([
    './autoauto',
    './autocomplete',
    './signaturehelp'], function () {

    class MonacoEditor {
        constructor(ui, element, container) {
            this.UI = ui;
            this.element_ = element;
            this.container_ = container;
            this.monacoEditor_ = null;
        }
        monacoEditor() {
            return this.monacoEditor_;
        }
        Initialize() {
            this.monacoEditor_ = monaco.editor.create(this.element_[0], {
                language: 'vb',
                theme: 'vs-dark',
                glyphMargin: true,
                //autoIndent: false, // doc says it defaults to false, but...
                automaticLayout: true, // check if its container dom node size has changed
                selectionHighlight: false, // repeats of selected word are not highlighted
                scrollbar: { vertical: 'visible' } // horizontal defaults auto
            });
            if (this.container_ === 'code') {
                // helpers
                this.AutoAuto = new ww.AutoAuto(this.UI.Channel);
                this.Decorate = new ww.Decorate(this.UI, this.monacoEditor_);
                let this_ = this; // closure can't handle this in the lambdas below
                this.monacoEditor_.onMouseDown(function (e) {
                    if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) { // xxx below
                        let channel = this_.UI.Channel;
                        let isBreak = this_.Decorate.Breaks.IsBreak(channel.CommitRebase.Name(), e.target.position.lineNumber);
                        let doBreak = isBreak ? false : true;
                        let request = {
                            command: 'break',
                            //target: channel.CommitRebase.Name,
                            target: channel.CommitRebase.Name(),
                            line: e.target.position.lineNumber,
                            on: doBreak
                        };
                        channel.PushPendingRequest(request);
                    }
                });
                this.monacoEditor_.addAction({
                    id: 'ww-enter',
                    label: 'enter',
                    keybindings: [monaco.KeyCode.Enter],
                    run: function (ed) {
                        let selection = this_.GetSelection();
                        let index = selection.first <= selection.last ? selection.first : selection.last;
                        let delete_count = selection.first <= selection.last ? selection.last - index : selection.first - index;
                        let change = new ww.Change(ww.ChangeOp.EditChangeOp, index, delete_count, '\r\n');
                        let changes = new ww.Changes([change]);
                        this_.ApplyChanges(changes, false);
                        let caret = index + 2;
                        let channel = this_.UI.Channel;
                        let target = channel.CommitRebase.Name();
                        if (target !== null) {
                            channel.CommitRebase.AppendPendingChange(ww.ChangeOp.EditChangeOp, caret);
                            channel.CommitRebase.AppendPendingChange(ww.ChangeOp.FixupChangeOp, index);
                            channel.CommitRebase.AppendPendingChange(ww.ChangeOp.EnterChangeOp, caret);
                            channel.PushPendingCommit();
                        }
                        return null;
                    }
                });
            }
            if(navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
                this.monacoEditor_.updateOptions({ fontSize: 24 });
            } else {
                this.monacoEditor_.updateOptions({ fontSize: 14 });
            }
            this.monacoEditor_.setValue(`\"${this.container_}\"\r\n`);
        }
        AppendText(text) {
            // https://microsoft.github.io/monaco-editor/api/uis/monaco.editor.icodeeditor.html#executechanges
            let value = this.monacoEditor_.getValue();
            if (!value.length) {
                value = text;
            } else {
                value = value + text;
            }
            this.monacoEditor_.setValue(value);
        }
        ApplyChanges(changes, is_server) {
            let changeOperations = [];

            let selection = this.GetSelection();

            let monacoEditor = this.monacoEditor_;
            changes.Changes().forEach(change => {
                let model = monacoEditor.getModel();
                let position1 = model.getPositionAt(change.Index());
                let position2 = model.getPositionAt(change.DeleteIndex());
                let range = new monaco.Range(position1.lineNumber, position1.column,
                    position2.lineNumber, position2.column);
                let edits = [{ range: range, text: change.Insert() }];
                monacoEditor.executeEdits("rebase", edits);
                selection.first = change.AdjustCaret(selection.first, is_server);
                selection.last = change.AdjustCaret(selection.last, is_server);
            });

            this.SetSelection(selection);
        }
        GetIndexRangeOfLine(index) {
            let model = this.monacoEditor_.getModel();
            let position = model.getPositionAt(index);
            position.column = 1;
            let first = model.getOffsetAt(position);
            let text = model.getLineContent(position.lineNumber);
            let last = first + text.length;
            return { first: first, last: last };
        }
        GetSelection() {
            let model = this.monacoEditor_.getModel();
            let rng = this.monacoEditor_.getSelection();
            let first = model.getOffsetAt(rng.getStartPosition());
            let last = model.getOffsetAt(rng.getEndPosition());
            return { first: first, last: last };
        }
        GetText() {
            return this.monacoEditor_.getValue();
        }
        ScrollToBottom() {
            let topLine = this.monacoEditor_.getModel().getLineCount();
            this.monacoEditor_.revealLine(topLine); // top line may be empty
        }
        ScrollToLine(line) {
            this.monacoEditor_.revealLine(line);
        }
        SetSelection(selection) {
            let model = this.monacoEditor_.getModel();
            let p1 = model.getPositionAt(selection.first);
            let p2 = model.getPositionAt(selection.last);
            let rng = new monaco.Range(p1.lineNumber, p1.column, p2.lineNumber, p2.column);
            this.monacoEditor_.setSelection(rng);
        }
        SetState(response) {
            let changeallowed = false;
            switch (this.container_) {
                case 'immediate':
                case 'watch':
                    changeallowed = response.is_idle || response.is_stopped;
                    break;
                case 'code':
                    changeallowed = !response.macro_loaded;
                    break;
            }
            this.monacoEditor_.updateOptions({ readOnly: !changeallowed });
            console.log(`${this.container_} readOnly: ${!changeallowed}`);
        }
        SetText(text) {
            this.monacoEditor_.setValue(text);
            this.monacoEditor_.revealLine(1);
        }
        SetVisible(show) {
            if (show) {
                this.element_.show();
            }
            else {
                this.element_.hide();
            }
        }
        GetVisibile() {
            return this.element_.css('display') !== 'none';
        }
   }

    ww.MonacoEditor = MonacoEditor;

});
