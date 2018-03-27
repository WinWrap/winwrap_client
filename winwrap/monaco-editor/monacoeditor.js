//FILE: monacoeditor.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class MonacoEditor {
        constructor(ui, channel, element) {
            this.channel_ = channel;
            this.element_ = element;
            this.autoEnter_ = true; // false: prevent enter insertion during auto completion
        }

        _Init(container) {
            this.monacoEditor_ = monaco.editor.create(this.element_[0], {
                language: 'vb',
                theme: 'vs-dark',
                glyphMargin: true,
                autoIndent: false, // doc says it defaults to false, but...
                formatOnPaste: false,
                formatOnType: false,
                automaticLayout: true, // check if its container dom node size has changed
                selectionHighlight: false, // repeats of selected word are not highlighted
                scrollbar: { vertical: 'visible' } // horizontal defaults auto
            });
            if(navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
                this.monacoEditor_.updateOptions({ fontSize: 24 });
            } else {
                this.monacoEditor_.updateOptions({ fontSize: 14 });
            }
            this.monacoEditor_.setValue(`\"${container}\"\r\n`);
            this.AutoAuto = new ww.AutoAuto(this.channel_);
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

        GetIndexRangeOfLineAt(index) {
            let model = this.monacoEditor_.getModel();
            let position = model.getPositionAt(index);
            position.column = 1;
            let text = model.getLineContent(position.lineNumber);
            let first = model.getOffsetAt(position);
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

        GetVisibile() {
            return this.element_.css('display') !== 'none';
        }

        SetSelection(selection) {
            let model = this.monacoEditor_.getModel();
            let p1 = model.getPositionAt(selection.first);
            let p2 = model.getPositionAt(selection.last);
            let rng = new monaco.Range(p1.lineNumber, p1.column, p2.lineNumber, p2.column);
            this.monacoEditor_.setSelection(rng);
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
    }

    ww.MonacoEditor = MonacoEditor;

    class MonacoImmediateEditor extends MonacoEditor {
        constructor(ui, channel, element) {
            super(ui, channel, element)
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddInitHandler(() => this_._Init());
        }

        _Init() {
            super._Init('immediate');
            let this_ = this; // closure can't handle this in the lambdas below
            this.channel_.AddResponseHandlers({
                debug: response => {
                    let text = undefined;
                    if (response.error_desc !== '') {
                        text = 'Error: ' + response.error_desc;
                    }
                    else if (response.action === 'get') {
                        text = response.value;
                    }
                    if (text !== undefined) {
                        let index = this_.GetSelection().first;
                        let change = new ww.Change(ww.ChangeOp.EditChangeOp, index, 0, text + '\r\n');
                        let changes = new ww.Changes([change]);
                        this_.ApplyChanges(changes, false);
                    }
                },
                notify_debugclear: response => {
                    this_.SetText('"immediate"\r\n');
                },
                notify_debugprint: response => {
                    // https://microsoft.github.io/monaco-editor/api/uis/monaco.editor.icodeeditor.html#executechanges
                    let value = this_.monacoEditor_.getValue();
                    this_.monacoEditor_.setValue(value + response.text);
                    let lastLine = this.monacoEditor_.getModel().getLineCount();
                    this.monacoEditor_.revealLine(lastLine);
                },
                state: response => {
                    this_.monacoEditor_.updateOptions({ readOnly: !response.is_idle && !response.is_stopped });
                    this_.SetVisible(!response.is_idle);
                }
            });
            this.monacoEditor_.onKeyUp(function (e) {
                if (e.keyCode === monaco.KeyCode.Enter) { // 3 not 13
                    let rng = this_.monacoEditor_.getSelection();
                    let model = this_.monacoEditor_.getModel();
                    let text = model.getLineContent(rng.startLineNumber - 1);
                    let depth = 0;
                    let language = 2;
                    this_.channel_.PushPendingRequest({ command: '?debug', depth: 0, language: language, text: text });
                }
            });
        }
    }

    ww.MonacoImmediateEditor = MonacoImmediateEditor;

    class MonacoWatchEditor extends MonacoEditor {
        constructor(ui, channel, element) {
            super(ui, channel, element)
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddInitHandler(() => this_._Init());
        }

        _Init() {
            super._Init('watch');
            let this_ = this; // closure can't handle this in the lambdas below
            this.channel_.AddResponseHandlers({
                notify_pause: response => {
                    let watches = this_.GetText().trim().split(/[\r]?\n/).filter(el => { return el !== ''; });
                    if (watches.length >= 1) { // xxx
                        this_.channel_.PushPendingRequest({ command: '?watch', watches: watches });
                    }
                },
                state: response => {
                    this_.monacoEditor_.updateOptions({ readOnly: !response.is_idle && !response.is_stopped });
                },
                watch: response => {
                    let watchResults = response.results.map(item => {
                        let value = item.error !== undefined ? item.error : item.value;
                        return `${item.depth}: ${item.expr} -> ${value}`;
                    }).join('\n');
                    this_.SetText(watchResults + '\n');
                }
            });
            this.monacoEditor_.onKeyUp(function (e) {
                if (e.keyCode === monaco.KeyCode.Enter) { // 3 not 13
                    let watches = this_.GetText().trim().split(/[\r]?\n/).filter(el => { return el !== ''; });
                    this_.channel_.PushPendingRequest({ command: '?watch', watches: watches });
                }
            });
        }
    }

    ww.MonacoWatchEditor = MonacoWatchEditor;

    class MonacoCodeEditor extends MonacoEditor {

        constructor(ui, channel, element) {
            super(ui, channel, element)
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddInitHandler(() => this_._Init());
        }

        _Init() {
            super._Init('code');
            let this_ = this; // closure can't handle this in the lambdas below
            this.channel_.CommitRebase.SetEditor(this);
            this.channel_.AddResponseHandlers({
                state: response => {
                    this_.monacoEditor_.updateOptions({ readOnly: !response.is_idle });
                },
                notify_pause: response => {
                    if (this_.channel_.CommitRebase.Name() !== response.file_name) {
                        this_.channel_.PushPendingRequest({ command: '?read', target: response.file_name });
                    }
                    let pauseLine = response.stack[0].linenum;
                    this_.monacoEditor_.revealLine(pauseLine);
                }
            });
            // helpers
            this.Decorate = new ww.Decorate(this.channel_, this.monacoEditor_);
            this.monacoEditor_.onMouseDown(function (e) {
                if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) { // xxx below
                    let channel = this_.channel_;
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
            this.monacoEditor_.onKeyUp(function (e) {
                if (e.keyCode === monaco.KeyCode.Enter) { // 3 not 13
                    let target = this_.channel_.CommitRebase.Name();
                    if (target === null) {
                        return;
                    }
                    // need to recognize on of two cases:
                    // case 1: enter pressed without auto completion list visible
                    //         - the cr-lf has already been inserted and
                    //           the leading spaces to auto indent have also been inserted
                    //         - remove the leading spaces
                    // case 2: enter pressed with auto completion list visible
                    //         - only the auto completion text has been inserted
                    //           no cr-lf has been inserted
                    //         - insert the cr-lf
                    let rng = this_.monacoEditor_.getSelection();
                    let model = this_.monacoEditor_.getModel();
                    let left = model.getValueInRange({
                        startLineNumber: rng.startLineNumber,
                        startColumn: 1,
                        endLineNumber: rng.endLineNumber,
                        endColumn: rng.endColumn
                    });
                    let pos = { lineNumber: rng.startLineNumber, column: rng.startColumn };
                    let index = model.getOffsetAt(pos);
                    let delete_count = 0;
                    if (left.trim() === '') {
                        // case 1
                        delete_count = left.length + 2;
                        index -= delete_count;
                    }
                    else if (!this_.autoEnter_) {
                        return;
                    }
                    let change = new ww.Change(ww.ChangeOp.EditChangeOp, index, delete_count, '\r\n');
                    let changes = new ww.Changes([change]);
                    this_.ApplyChanges(changes, false);
                    index += 2; // advance caret
                    this_.channel_.CommitRebase.AppendPendingChange(ww.ChangeOp.EditChangeOp, index);
                    this_.channel_.CommitRebase.AppendPendingChange(ww.ChangeOp.FixupChangeOp, index - 2);
                    this_.channel_.CommitRebase.AppendPendingChange(ww.ChangeOp.EnterChangeOp, index);
                    this_.channel_.PushPendingCommit();
                }
            });
        }
    }

    ww.MonacoCodeEditor = MonacoCodeEditor;
});
