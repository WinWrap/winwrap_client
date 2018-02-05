define(function () {

    // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.itextmodelwithdecorations.html
    // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.imodeldeltadecoration.html
    class DebugDecorate {
        constructor(ui) {
            this.UI = ui;
            this.oldDecorations = '';
        }
        _breakDecoration(line) {
            let decoration = {};
            decoration.range = new monaco.Range(line, 1, line, 1);
            decoration.options = { isWholeLine: true, 'glyphMarginClassName': 'myGlyphMarginClass' };
            return decoration;
        }
        _breaksDecorations(target) {
            let decorations = [];
            let this0 = this;
            let breaks = this.UI.Breaks.getBreaks(target);
            breaks.forEach(abreak => {
                let decoration = this0._breakDecoration(abreak.line);
                decorations.push(decoration);
            });
            return decorations;
        }
        _pauseDecoration(target) {
            let decorations = [];
            let line = this.UI.Stack.getPauseLine(target);
            if (line !== null) {
                let decoration = {};
                decoration.range = new monaco.Range(line, 1, line, 1);
                decoration.options = { isWholeLine: true, 'className': 'myDebugPauseClass' };
                decorations.push(decoration);
            }
            return decorations;
        }
        _errorDecoration(target) {
            let decorations = [];
            //let line = this.UI.Stack.getPauseLine(target);
            let line = 5;
            if (line !== null) {
                let decoration = {};
                decoration.range = new monaco.Range(line, 1, line, 1);
                decoration.options = { isWholeLine: true, 'className': 'myDebugPauseClass' };
                decorations.push(decoration);
            }
            return decorations;
        }
        display() {
            let decorations = [];
            let target = this.UI.Channel.CommitRebase.Name;
            decorations.push(...this._breaksDecorations(target));
            decorations.push(...this._pauseDecoration(target));
            decorations.push(...this._errorDecoration(target));
            if (decorations.length >= 1) {
                this.oldDecorations = this.UI.EditorCode.editor().deltaDecorations(this.oldDecorations, decorations);
            } else {
                this.oldDecorations = this.UI.EditorCode.editor().deltaDecorations(this.oldDecorations,
                    [{ range: new monaco.Range(1, 1, 1, 1), options: {} }]);
            }
        }
    }

    ww.DebugDecorate = DebugDecorate;

});
