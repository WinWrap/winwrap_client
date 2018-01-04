var ww = ww || {};

(function () {

    class TestEditorPrototype {
        constructor(codeeditor) {
            this.codeeditor = codeeditor;
            this.editor_ = ww.EditorCode.editor();
            this.editid_ = { major: 1, minor: 1 };
            this.expected_ = null;
            this.received_ = null;
            this.result_ = null;
        }

        wait(ms) {
            return new Promise(r => setTimeout(r, ms));
        }

        async RunTest2() {
            let macroname = "\\a2.bas";
            this.result_ = await ww.InputMacro.ReadAsync(macroname);
            let read = this.result_.find(o => o.response === "!read");
            ww.CommitRebase.Read(read);
            this.insertText(/^/, "'#");
            let commitRequest = ww.CommitRebase.GetCommitRequest();
            this.result_ = await new ww.AjaxPost().Send(commitRequest);
            ww.Browser.Log([commitRequest, this.result_]);
            this.result_ = await ww.InputMacro.ReadAsync(macroname);
            this.setCaret(/'#/);
            this.editor_.trigger('mysource', 'editor.action.triggerSuggest', {});
            await this.wait(500);
            return this.result_;
        }

        // editor.trigger('source - use any string you like', 'editor.action.triggerSuggest', {});
        // editor.trigger('source - use any string you like', 'editor.action.triggerParameterHints', {});
        async RunTest() {
            await this.PrototypeTest("test1", "\\Macro2.bas", /MsgBox/, "()", /MsgBox\(/);
            await this.PrototypeTest("test1", "\\Macro2.bas", /MsgBox\(/, "\"\"", /MsgBox\(\"/);
            await this.PrototypeTest("test1", "\\Macro2.bas", /MsgBox\("/, "x", /MsgBox\("x/);
            await this.PrototypeTest("test1", "\\Macro2.bas", /MsgBox\("x"/, ",", /MsgBox\("x",/);
            await this.PrototypeTest("test1", "\\Macro2.bas", /MsgBox\("x",/, "2,", /MsgBox\("x",2,/);
            await this.PrototypeTest("test1", "\\Macro2.bas", /MsgBox\("x",2,/, "3", /\)/);
            this.checkText("test1", this.expected_, this.received_, "parameter hints left showing");
            ww.Browser.Log(this.result_);
        }

        insertText(regex, text) {
            let matches = this.editor_.getModel().findMatches(regex, false, true, false, false);
            let match = matches[0];
            let range = new monaco.Range(match.endLineNumber, match.endColumn, match.endLineNumber, match.endColumn);
            let op = { identifier: this.editid_, range: range, text: text, forceMoveMarkers: true };
            this.editor_.executeEdits("my-source", [op]);
        }

        setCaret(regex) {
            let matches = this.editor_.getModel().findMatches(regex, false, true, false, false);
            let match = matches[0];
            let range = new monaco.Range(match.endLineNumber, match.endColumn, match.endLineNumber, match.endColumn);
            let position = { lineNumber: match.endLineNumber, column: match.endColumn };
            this.editor_.setPosition(position);
            this.editor_.focus();
        }

        async PrototypeTest(testname, macroname, regexInsert, text, regexCaret) {
            this.result_ = await ww.InputMacro.ReadAsync(macroname);
            this.insertText(regexInsert, text);
            this.expected_ = this.editor_.getValue();
            let commitRequest = ww.CommitRebase.GetCommitRequest();
            this.result_ = await new ww.RequestPrototype().Send(commitRequest);
            this.result_ = await ww.InputMacro.ReadAsync(macroname);
            this.received_ = this.editor_.getValue();
            this.setCaret(regexCaret);
            this.editor_.trigger('mysource', 'editor.action.triggerParameterHints', {});
            await this.wait(500);
            return this.result_;
        }

        checkText(testname, expected, received, comment) {
            let sameText = expected === received;
            let sameLength = expected.length === received.length;
            if (!sameText) {
                ww.Browser.Log({ expected: expected, received: received });
            }
            if (!sameLength) {
                ww.Browser.Log({ expected: expected.length, received: received.length });
            }
            if (sameText && sameLength) {
                ww.Browser.Log(testname + " passed (" + comment + ")");
            }
        }
    }

    ww.TestEditorPrototype = TestEditorPrototype;

})();
