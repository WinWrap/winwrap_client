var ww = ww || {};

(function () {

    // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.itextmodelwithdecorations.html
    // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.imodeldeltadecoration.html
    class DebugDecorate {
        constructor() {
            this.oldDecorations = "";
        }
        _breakDecoration(line) {
            let decoration = {};
            decoration.range = new monaco.Range(line, 1, line, 1);
            decoration.options = { isWholeLine: true, "glyphMarginClassName": "myGlyphMarginClass" };
            return decoration;
        }
        _breaksDecorations(target) {
            let decorations = [];
            let this0 = this; // should not be necessary ? bug in Edge ?
            let breaks = ww.BreaksPause.getBreaks(target);
            breaks.forEach(function (abreak) {
                let decoration = this0._breakDecoration(abreak.line);
                decorations.push(decoration);
            });
            return decorations;
        }
        _pauseDecoration(target) {
            let line = ww.BreaksPause.getPauseLine(target);
            if (line === null) {
                return null;
            }
            let decoration = {};
            decoration.range = new monaco.Range(line, 1, line, 1);
            decoration.options = { isWholeLine: true, "className": "myDebugPauseClass" };
            return decoration;
        }
        display() {
            let decorations = [];
            let target = ww.InputMacro.GetValue();
            let breaksDecorations = this._breaksDecorations(target);
            Array.prototype.push.apply(decorations, breaksDecorations);
            let pauseDecoration = this._pauseDecoration(target);
            if (pauseDecoration !== null) {
                decorations.push(pauseDecoration);
            }
            if (decorations.length >= 1) {
                this.oldDecorations = ww.EditorCode.editor().deltaDecorations(this.oldDecorations, decorations);
            } else {
                this.oldDecorations = ww.EditorCode.editor().deltaDecorations(this.oldDecorations,
                    [{ range: new monaco.Range(1, 1, 1, 1), options: {} }]);
            }
        }
    }

    ww.DebugDecorate = new DebugDecorate();

})();
