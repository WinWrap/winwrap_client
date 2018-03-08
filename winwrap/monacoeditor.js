define(function () {

    class MonacoEditor {
        constructor(ui, element, container) {
            this.ui_ = ui;
            this.element_ = element;
            this.container_ = container;
            this.editor_ = null;
        }
        editor() {
            return this.editor_;
        }
        Initialize() {
            let editor = monaco.editor.create(this.element_[0], {
                language: 'vb',
                theme: 'vs-dark',
                glyphMargin: true,
                //autoIndent: false, // doc says it defaults to false, but...
                automaticLayout: true, // check if its container dom node size has changed
                selectionHighlight: false, // repeats of selected word are not highlighted
                scrollbar: { vertical: 'visible' } // horizontal defaults auto
            });
            this.editor_ = editor;
            if(navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
                editor.updateOptions({ fontSize: 24 });
            } else {
                editor.updateOptions({ fontSize: 14 });
            }
            editor.setValue(`\"${this.container_}\"\r\n`);
            this.resize();
            let ui = this.ui_; // closure can't handle this in the lambdas below
            editor.onMouseDown(function (e) {
                if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) { // xxx below
                    let channel = ui.Channel;
                    let isBreak = ui.Breaks.isBreak(channel.CommitRebase.ActiveDoc.Name(), e.target.position.lineNumber);
                    let doBreak = isBreak ? false : true;
                    let request = {
                        command: 'break',
                        target: channel.CommitRebase.Name,
                        line: e.target.position.lineNumber,
                        on: doBreak
                    };
                    channel.PushPendingRequest(request);
                }
            });
            let this_ = this;
            editor.addAction({
                id: 'ww-enter',
                label: 'enter',
                keybindings: [monaco.KeyCode.Enter],
                run: function (ed) {
                    let selection = this_.getSelection();
                    let index = selection.first <= selection.last ? selection.first : selection.last;
                    let delete_count = selection.first <= selection.last ? selection.last - index : selection.first - index;
                    let edit = new ww.Edit(ww.EditOp.EditEditOp, index, delete_count, '\r\n');
                    let edits = new ww.Edits([edit]);
                    this_.applyEdits(edits);
                    this_.setSelection(index + 2);
                    let channel = ui.Channel;
                    let doc = channel.CommitRebase.ActiveDoc;
                    if (doc !== null) {
                        doc.AppendPendingEdit();
                        doc.AppendPendingEdit(ww.EditOp.FixupEditOp, index + 2); // should be +0, but this works (2/27/18)
                        doc.AppendPendingEdit(ww.EditOp.EnterEditOp, index + 4); // should be +2, but this works (2/27/18)
                        channel.PushPendingCommit();
                    }
                }
            });
        }
        appendText(text) {
            // https://microsoft.github.io/monaco-editor/api/uis/monaco.editor.icodeeditor.html#executeedits
            let value = this.editor_.getValue();
            if (!value.length) {
                value = text;
            } else {
                value = value + text;
            }
            this.editor_.setValue(value);
        }
        applyEdits(edits, is_server) {
            let editOperations = [];

            let selection = this.getSelection();

            let model = this.editor_.getModel();
            edits.Edits().forEach(edit => {
                let position1 = model.getPositionAt(edit.Index());
                let position2 = model.getPositionAt(edit.DeleteIndex());
                let range = new monaco.Range(position1.lineNumber, position1.column,
                    position2.lineNumber, position2.column);
                let edits = [{ range: range, text: edit.Insert() }];
                this.editor_.executeEdits("rebase", edits);
                selection.first = edit.AdjustCaret(selection.first, is_server);
                selection.last = edit.AdjustCaret(selection.last, is_server);
            });

            this.setSelection(selection.first, selection.last);
        }
        getLineFromIndex(index) {
            let model = this.editor_.getModel();
            let position = model.getPositionAt(index);
            return position.lineNumber;
        }
        getLineRange(line) {
            let model = this.editor_.getModel();
            let first = model.getOffsetAt({ lineNumber: line, column: 1 });
            let last = model.getOffsetAt({ lineNumber: line + 1, column: 1 });
            if (last >= first + 2) {
                last -= 2;
            }
            return { first: first, last: last - 2 };
        }
        getText() {
            return this.editor_.getValue();
        }
        getSelection() {
            /*
            // previous code
            let position = this.editor_.getPosition();
            let model = this.editor_.getModel();
            let caret = model.getOffsetAt(position);
            return { 'first': caret, 'last': caret };
            */
            let model = this.editor_.getModel();
            let rng = this.editor_.getSelection();
            let first = model.getOffsetAt(rng.getStartPosition());
            let last = model.getOffsetAt(rng.getEndPosition());
            return { first: first, last: last };
        }
        hide() {
            this.element_.hide();
        }
        resize() {
            // editor options "automaticLayout: true" checks size every 100ms
            /*let showing = this.showing();
            if (!showing) {
                this.show(); // only for a showing element is the width accurate
            }
            // adjusting code editor height did not adjust encompassing divs
            this.editor_.layout({ width: this.element_.innerWidth(), height: this.element_.innerHeight() });
            if (!showing) {
                this.hide();
            }*/
        }
        scrollToBottom() { // horizontal auto
            let topLine = this.editor_.getModel().getLineCount();
            this.editor_.revealLine(topLine); // top line may be empty
        }
        scrollToSelection() {
            // to be written
        }
        setSelection(first, last) {
            let model = this.editor_.getModel();
            let p1 = model.getPositionAt(first);
            let p2 = last === undefined ? p1 : model.getPositionAt(last);
            let rng = new monaco.Range(p1.lineNumber, p1.column, p2.lineNumber, p2.column);
            this.editor_.setSelection(rng);
        }
        show() {
            this.element_.show();
        }
        showing() {
            return this.element_.css('display') !== 'none';
        }
        textUntilPosition(model, position) {
            let text = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });
            return text;
        }
        SetState(response) {
            let editallowed = false;
            switch (this.container_) {
                case 'immediate':
                case 'watch':
                    editallowed = response.is_idle;
                    break;
                case 'code':
                    editallowed = !response.macro_loaded;
                    break;
            }
            this.editor_.updateOptions({ readOnly: !editallowed });
            console.log(`${this.container_} readOnly: ${!editallowed}`);
        }
   }

    ww.MonacoEditor = MonacoEditor;

});
