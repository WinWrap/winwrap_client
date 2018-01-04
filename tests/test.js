var ww = ww || {};

(function () {

    // editor.trigger('source - use any string you like', 'editor.action.triggerSuggest', {});
    // editor.trigger('source - use any string you like', 'editor.action.triggerParameterHints', {});

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
