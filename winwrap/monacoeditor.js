define(function () {

    ww.MonacoEditor = function (ui, element, container, height) { // class used for Code, Immediate, Watch editors
        let ui_ = ui;
        let editor_;
        let element_ = element;
        let editorWidth_ = $(window).width() - 20;
        let height_ = height; // Number(height) seemed needed at one time
        return {
            'applyEdit': function (edit) {
                let model = this.editor().getModel();
                let position1 = model.getPositionAt(edit.Index);
                let position2 = model.getPositionAt(edit.Index + edit.DeleteCount);
                let range = new monaco.Range(position1.lineNumber, position1.column,
                    position2.lineNumber, position2.column); 
                let edits = [
                    {
                        range: range,
                        text: edit.Insert
                    }];
                this.editor().executeEdits("rebase", edits);
            },
            'scrollToSelection': function () {
                // to be written
            },
            'getText': function () {
                return this.editor().getValue();
            },
            'getSelection': function () {
                let position = this.editor().getPosition();
                let model = this.editor().getModel();
                let textUntilPosition = ui_.EditorCode.textUntilPosition(model, position);
                let caret = textUntilPosition.length;
                return { 'first': caret, 'last': caret };
            },
            'editor': function () {
                return editor_;
            },
            'Initialize': function () {
                editor_ = monaco.editor.create(element_[0], {
                    language: 'vb',
                    theme: 'vs-dark',
                    glyphMargin: true,
                    scrollbar: { vertical: 'visible' } // xxx horizontal ?
                });
                editor_.layout({ width: editorWidth_, height: height_ }); // xxx onresize
                if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
                    editor_.updateOptions({ fontSize: 24 });
                } else {
                    editor_.updateOptions({ fontSize: 14 });
                }
                editor_.setValue(`\"${container}\"\r\n`);
                editor_.onMouseDown(function (e) {
                    if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) { // xxx below
                        let channel = ui_.Channel;
                        let isBreak = ui_.Breaks.isBreak(channel.CommitRebase.Name, e.target.position.lineNumber);
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
            },
            'showing': function () {
                return element_.css('display') !== 'none';
            },
            'show': function () {
                element_.show();
            },
            'hide': function () {
                element_.hide();
            },
            'appendText': function (text) {
                // https://microsoft.github.io/monaco-editor/api/uis/monaco.editor.icodeeditor.html#executeedits
                let value = editor_.getValue();
                if (!value.length) {
                    value = text;
                } else {
                    value = value + text;
                }
                editor_.setValue(value);
            },
            'scrollToBottom': function () { // xxx needs work
                let lines = editor_.getModel().getLineCount();
                let top = editor_.getTopForLineNumber(lines);
                let lineHeight = editor_.getConfiguration().lineHeight;
                let contentHeight = editor_.getLayoutInfo().contentHeight;
                editor_.setScrollTop(top - contentHeight + lineHeight); // xxx
                let scrollHeight = editor_.getScrollHeight();
            },
            'textUntilPosition': function (model, position) {
                let text = model.getValueInRange({
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                });
                return text;
            },
            'SetState': function (response) {
                // to do
            }
        };
    };

});
