define(function () {

    class MonacoEditor {
        constructor(ui, element, container) {
            this.ui_ = ui;
            this.element_ = element;
            this.container_ = container;
            this.editor_ = null;
        }
        Initialize() {
            this.editor_ = monaco.editor.create(this.element_[0], {
                language: 'vb',
                theme: 'vs-dark',
                glyphMargin: true,
                scrollbar: { vertical: 'visible' } // xxx horizontal ?
            });
            if(navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
                this.editor_.updateOptions({ fontSize: 24 });
            } else {
                this.editor_.updateOptions({ fontSize: 14 });
            }
            this.editor_.setValue(`\"${this.container_}\"\r\n`);
            this.resize();
            let ui = this.ui_; // closure can't handle this in the lambdas below
            this.editor_.onMouseDown(function (e) {
                if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) { // xxx below
                    let channel = ui.Channel;
                    let isBreak = ui.Breaks.isBreak(channel.CommitRebase.Name, e.target.position.lineNumber);
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
            //this.editor_.resize(() => {
            //    this.resize();
            //});
        }
        applyEdit(edit) {
            let model = this.editor_.getModel();
            let position1 = model.getPositionAt(edit.Index());
            let position2 = model.getPositionAt(edit.DeleteIndex());
            let range = new monaco.Range(position1.lineNumber, position1.column,
                position2.lineNumber, position2.column); 
            let edits = [{ range: range, text: edit.Insert() }];
            this.editor_.executeEdits("rebase", edits);
        }
        scrollToSelection() {
            // to be written
        }
        getText() {
            return this.editor_.getValue();
        }
        getSelection() {
            let position = this.editor_.getPosition();
            let model = this.editor_.getModel();
            let caret = model.getOffsetAt(position);
            return { 'first': caret, 'last': caret };
        }
        editor() {
            return this.editor_;
        }
        showing() {
            return this.element_.css('display') !== 'none';
        }
        show() {
            this.element_.show();
        }
        hide() {
            this.element_.hide();
        }
        resize() {
            console.log(`$(window).height() = ${$(window).height()}`);
            console.log(`this.element_.innerHeight() = ${this.element_.innerHeight()}`)
            //console.log(`$(".ww-item-version").top() = ${$(".ww-item-version").top()}`)
            let el = $(".ww-remote-1 ww-item-version");
            console.log(el.top());
            let showing = this.showing();
            if (!showing) {
                this.show(); // width of showing element is accurate
            }
            this.editor_.layout({ width: this.element_.innerWidth(), height: this.element_.innerHeight() });
            if (!showing) {
                this.hide();
            }
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
        scrollToBottom() { // xxx needs work
            let lines = this.editor_.getModel().getLineCount();
            let top = this.editor_.getTopForLineNumber(lines);
            let lineHeight = this.editor_.getConfiguration().lineHeight;
            let contentHeight = this.editor_.getLayoutInfo().contentHeight;
            this.editor_.setScrollTop(top - contentHeight + lineHeight); // xxx
            let scrollHeight = this.editor_.getScrollHeight();
        }
        setSelection(first, last) {
            // to be written
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
        }
    }

    ww.MonacoEditor = MonacoEditor;

});
