var ww = ww || {};

(function () {

    ww.MonacoEditor = function (container, height) { // class used for Code, Immediate, Watch editors
        let editor_;
        let container_ = container;
        let editorWidth_ = $(window).width() - 20;
        let height_ = height; // Number(height) seemed needed at one time
        let init_ = function () {
            editor_ = monaco.editor.create(document.getElementById(container), {
                language: 'vb',
                theme: "vs-dark",
                glyphMargin: true,
                scrollbar: { vertical: "visible" } // xxx horizontal ?
            });
            editor_.layout({ width: editorWidth_, height: height_ }); // xxx onresize
            if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
                editor_.updateOptions({ fontSize: 24 });
            } else {
                editor_.updateOptions({ fontSize: 14 });
            }
            editor_.setValue(`\"${container_}\"\r\n`);
        };
        init_();
        return {
            "getText": function () {
                return this.editor().getValue();
            },
            "getSelection": function () {
                let position = this.editor().getPosition();
                let model = this.editor().getModel();
                let textUntilPosition = ww.EditorCode.textUntilPosition(model, position);
                let caret = textUntilPosition.length;
                return { "first": caret, "last": caret };
            },
            "editor": function () {
                return editor_;
            },
            "bindOnMouseDown": function () {
                editor_.onMouseDown(function (e) {
                    if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) { // xxx below
                        let isBreak = ww.BreaksPause.isBreak(ww.CommitRebase.Name, e.target.position.lineNumber);
                        let doBreak = isBreak ? false : true;
                        let request = {
                            command: "break",
                            target: ww.CommitRebase.Name,
                            line: e.target.position.lineNumber,
                            on: doBreak
                        };
                        ww.Ajax.PushPendingRequest(request);
                    }
                });
            },
            "showing": function () {
                return $(`#${container_}`).css('display') !== 'none';
            },
            "show": function () {
                $(`#${container_}`).show();
            },
            "hide": function () {
                $(`#${container_}`).hide();
            },
            "appendText": function (text) {
                // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.icodeeditor.html#executeedits
                let value = editor_.getValue();
                if (!value.length) {
                    value = text;
                } else {
                    value = value + text;
                }
                editor_.setValue(value);
            },
            "scrollToBottom": function () { // xxx needs work
                let lines = editor_.getModel().getLineCount();
                let top = editor_.getTopForLineNumber(lines);
                let lineHeight = editor_.getConfiguration().lineHeight;
                let contentHeight = editor_.getLayoutInfo().contentHeight;
                editor_.setScrollTop(top - contentHeight + lineHeight); // xxx
                let scrollHeight = editor_.getScrollHeight();
            },
            "textUntilPosition": function (model, position) {
                let text = model.getValueInRange({
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                });
                return text;
            }
        };
    };

})();

/*ww.InitCode = function () { // not used, was for testing
    code1 = [
        '\'#Language "WWB.NET"',
        '',
        'Imports System.Collections.Generic',
        '',
        'Sub Main',
        '    Dim x As Boolean',
        '    MessageBox.Show(\"Hi\")',
        '    Dim i As Integer = Integer.Parse(\"24\")',
        'End Sub'
    ].join('\n');
    code2 = [
        '\'#Language "WWB.NET"',
        '',
        'Imports System.Collections.Generic',
        '',
        'Sub Main',
        '    Integer.Parse',
        'End Sub'
    ].join('\n');
    code3 = [
        '\'#Language "WWB.NET"',
        '',
        'Sub Main',
        '    Dim x As ',
        'End Sub'
    ].join('\n');
    code = code3;
    return {
        value: code
    };
};*/

/*ww.MonacoSync = function (obj) { // save this code !!!
    var delay = (function () {
        let timer = 0;
        return function (callback, ms) {
            clearTimeout(timer);
            timer = setTimeout(callback, ms);
        };
    })();
    return new monaco.Promise(function (c, e, p) {
        let waitformsg = function (x) {
            delay(function () {
                if (x.isdone) {
                    c(x.isdone);
                } else {
                    waitformsg(x);
                }
            },
                // xxx repeat for a while, put limit later, use partial data still later
                100);
        };
        waitformsg(obj);
    });
};*/
