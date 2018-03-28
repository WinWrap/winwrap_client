var ww = ww || {};

(function () {

    class TestPrototype {
        constructor(codeeditor) {
            this.Editor = codeeditor.editor();
            this.editid_ = { major: 1, minor: 1 };
        }

        SetCaret(regex) {
            let matches = this.Editor.getModel().findMatches(regex, false, true, false, false);
            let match = matches[0];
            let range = new monaco.Range(match.endLineNumber, match.endColumn, match.endLineNumber, match.endColumn);
            let position = { lineNumber: match.endLineNumber, column: match.endColumn };
            this.Editor.setPosition(position);
            this.Editor.focus();
        }

        InsertText(regex, text) {
            let matches = this.Editor.getModel().findMatches(regex, false, true, false, false);
            let match = matches[0];
            let range = new monaco.Range(match.endLineNumber, match.endColumn, match.endLineNumber, match.endColumn);
            let op = { identifier: this.editid_, range: range, text: text, forceMoveMarkers: true };
            this.Editor.executeEdits("my-source", [op]);
        }

        Wait(ms) {
            return new Promise(r => setTimeout(r, ms));
        }

    }

    ww.TestPrototype = TestPrototype;

})();

// code samples - do not remove

/*detect code editor "Enter" key
    editor.onKeyUp(function (e) {
        if (e.keyCode === monaco.KeyCode.Enter) { // 3 not 13
            console.log("e.keyCode === monaco.KeyCode.Enter");
        }
    });
*/

/*
    editor.trigger('mysource', 'editor.action.triggerSuggest', {});
    editor.trigger('mysource', 'editor.action.triggerParameterHints', {});
*/