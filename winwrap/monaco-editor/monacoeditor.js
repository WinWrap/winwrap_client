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
            this.ui_ = ui;
            this.Channel = channel;
            this.element_ = element;
            this.Container = '';
            this.CodeEditor = this;
            this.autoEnter_ = true; // false: prevent enter insertion during auto completion
        }

        _Init(container) {
            this.Container = container;
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
            if(navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/)) {
                this.monacoEditor_.updateOptions({ fontSize: 24 });
            } else {
                this.monacoEditor_.updateOptions({ fontSize: 14 });
            }
            this.monacoEditor_.setValue(`\"${container}\"\r\n`);
            this.CodeEditor = this.ui_.GetItem('ww-item-code');
            ww.MonacoShared.RegisterModel(this.monacoEditor_.getModel(), this);
            this.Channel.AddResponseHandlers({
                detach: response => {
                    this.Enabled(false);
                }
            });
        }

        ApplyChange(change, is_server) {
            let selection = this.GetSelection();
            let model = this.monacoEditor_.getModel();
            let position1 = model.getPositionAt(change.Index());
            let position2 = model.getPositionAt(change.DeleteIndex());
            let range = new monaco.Range(position1.lineNumber, position1.column,
                position2.lineNumber, position2.column);
            let edits = [{ range: range, text: change.Insert() }];
            this.monacoEditor_.executeEdits("rebase", edits);
            selection.first = change.AdjustCaret(selection.first, is_server);
            selection.last = change.AdjustCaret(selection.last, is_server);
            this.SetSelection(selection);
        }

        Enabled(enable) {
            this.monacoEditor_.updateOptions({ readOnly: !enable });
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
            channel.AddInitHandler(() => this._Init());
        }

        _Init() {
            super._Init('immediate');
            this.Channel.AddResponseHandlers({
                debug: response => {
                    let text = undefined;
                    if (response.error_desc !== '') {
                        text = 'Error: ' + response.error_desc;
                    }
                    else if (response.action === 'get') {
                        text = response.value;
                    }
                    if (text !== undefined) {
                        let index = this.GetSelection().first;
                        let change = new ww.Change(ww.ChangeOp.EditChangeOp, index, 0, text + '\r\n');
                        this.ApplyChange(change, false);
                    }
                },
                notify_debugclear: response => {
                    this.SetText('"immediate"\r\n');
                },
                notify_debugprint: response => {
                    // https://microsoft.github.io/monaco-editor/api/uis/monaco.editor.icodeeditor.html#executechanges
                    let value = this.monacoEditor_.getValue();
                    this.monacoEditor_.setValue(value + response.text);
                    let lastLine = this.monacoEditor_.getModel().getLineCount();
                    this.monacoEditor_.revealLine(lastLine);
                },
                state: response => {
                    this.Enabled(response.is_idle || response.is_stopped);
                    this.SetVisible(!response.is_idle);
                }
            });
            this.monacoEditor_.onKeyUp(e => {
                if (e.keyCode === monaco.KeyCode.Enter) { // 3 not 13
                    let rng = this.monacoEditor_.getSelection();
                    let model = this.monacoEditor_.getModel();
                    let text = model.getLineContent(rng.startLineNumber);
                    if (text.trim() === '') {
                        text = model.getLineContent(rng.startLineNumber - 1);
                        let depth = 0;
                        let language = 2;
                        this.Channel.PushPendingRequest({ request: '?debug', depth: 0, language: language, text: text });
                    }
                }
            });
        }
    }

    ww.MonacoImmediateEditor = MonacoImmediateEditor;

    class MonacoWatchEditor extends MonacoEditor {
        constructor(ui, channel, element) {
            super(ui, channel, element)
            channel.AddInitHandler(() => this._Init());
        }

        _Init() {
            super._Init('watch');
            this.Channel.AddResponseHandlers({
                notify_pause: response => {
                    let watches = this.GetText().trim().split(/[\r]?\n/).filter(el => { return el !== ''; });
                    if (watches.length >= 1) { // xxx
                        this.Channel.PushPendingRequest({ request: '?watch', watches: watches });
                    }
                },
                state: response => {
                    this.Enabled(response.is_idle || response.is_stopped);
                },
                watch: response => {
                    let watchResults = response.results.map(item => {
                        let value = item.error !== undefined ? item.error : item.value;
                        return `${item.depth}: ${item.expr} -> ${value}`;
                    }).join('\n');
                    this.SetText(watchResults + '\n');
                }
            });
            this.monacoEditor_.onKeyUp(e => {
                if (e.keyCode === monaco.KeyCode.Enter) { // 3 not 13
                    let watches = this.GetText().trim().split(/[\r]?\n/).filter(el => { return el !== ''; });
                    this.Channel.PushPendingRequest({ request: '?watch', watches: watches });
                }
            });
        }
    }

    ww.MonacoWatchEditor = MonacoWatchEditor;

    class MonacoCodeEditor extends MonacoEditor {

        constructor(ui, channel, element) {
            super(ui, channel, element)
            channel.AddInitHandler(() => this._Init());
        }

        _Init() {
            super._Init('code');
            this.Channel.CommitRebase.SetEditor(this);
            this.Channel.AddResponseHandlers({
                state: response => {
                    this.Enabled(response.is_idle);
                },
                notify_pause: response => {
                    if (this.Channel.CommitRebase.Name() !== response.file_name) {
                        this.Channel.PushPendingRequest({ request: '?read', target: response.file_name });
                    }
                    let pauseLine = response.stack[0].linenum;
                    this.monacoEditor_.revealLine(pauseLine);
                }
            });
            // helpers
            this.Decorate = new ww.Decorate(this.Channel, this.monacoEditor_);
            this.monacoEditor_.onMouseDown(e => {
                if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) { // xxx below
                    let channel = this.Channel;
                    let isBreak = this.Decorate.Breaks.IsBreak(channel.CommitRebase.Name(), e.target.position.lineNumber);
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
            this.monacoEditor_.onKeyUp(e => {
                if (e.keyCode === monaco.KeyCode.Enter) { // 3 not 13
                    let target = this.Channel.CommitRebase.Name();
                    if (target === null) {
                        return;
                    }
                    // need to recognize one of two cases:
                    // case 1: enter pressed without auto completion list visible
                    //         - the cr-lf has already been inserted and
                    //           the leading spaces to auto indent have also been inserted
                    //         - remove the leading spaces
                    // case 2: enter pressed with auto completion list visible
                    //         - only the auto completion text has been inserted
                    //           no cr-lf has been inserted
                    //         - insert the cr-lf
                    let rng = this.monacoEditor_.getSelection();
                    let model = this.monacoEditor_.getModel();
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
                    else if (!this.autoEnter_) {
                        return;
                    }
                    let change = new ww.Change(ww.ChangeOp.EditChangeOp, index, delete_count, '\r\n');
                    this.ApplyChange(change, false);
                    index += 2; // advance caret
                    this.Channel.CommitRebase.AppendPendingChange(ww.ChangeOp.EditChangeOp, index);
                    this.Channel.CommitRebase.AppendPendingChange(ww.ChangeOp.FixupChangeOp, index - 2);
                    this.Channel.CommitRebase.AppendPendingChange(ww.ChangeOp.EnterChangeOp, index);
                    this.Channel.PushPendingCommit();
                }
            });
        }
    }

    ww.MonacoCodeEditor = MonacoCodeEditor;
});
