var ww = ww || {};

(function () {

    // editor.trigger('source - use any string you like', 'editor.action.triggerSuggest', {});
    // editor.trigger('source - use any string you like', 'editor.action.triggerParameterHints', {});

    class Test001 {
        constructor() { }

        async Run() {
            //await this.Part001();
            //await this.Part002();
            await this.Part003();
        }

        async Part003() {
            let macroname = "\\test003.bas";
            this.result_ = await ww.InputMacro.ReadAsync(macroname);
            let read = this.result_.find(o => o.response === "!read");
            ww.CommitRebase.Read(read);
            ww.Test.InsertText(/MsgBox/, "()");
            let request = ww.CommitRebase.GetCommitRequest();
            this.result_ = await new ww.AjaxPost().SendAsync(request, ["!rebase"]);
            //this.result_ = await ww.InputMacro.ReadAsync(macroname); // rebase instead ?
            let rebase = this.result_.find(o => o.response === "!rebase");
            //ww.CommitRebase.Rebase(rebase); // not needed for this test
            ww.Test.SetCaret(/MsgBox\(/);
            ww.Test.Editor.trigger('mysource', 'editor.action.triggerParameterHints', {});
            await ww.Test.Wait(500);
            return this.result_;
        }

        async Part002() {
            let macroname = "\\test002.bas";
            this.result_ = await ww.InputMacro.ReadAsync(macroname);
            let read = this.result_.find(o => o.response === "!read");
            ww.CommitRebase.Read(read);
            ww.Test.SetCaret(/As /);
            ww.Test.Editor.trigger('mysource', 'editor.action.triggerSuggest', {});
            await ww.Test.Wait(500);
            return this.result_;
        }

        async Part001() {
            let macroname = "\\test001.bas";
            this.result_ = await ww.InputMacro.ReadAsync(macroname);
            let read = this.result_.find(o => o.response === "!read");
            ww.CommitRebase.Read(read);
            ww.Test.SetCaret(/'#/);
            ww.Test.Editor.trigger('mysource', 'editor.action.triggerSuggest', {});
            await ww.Test.Wait(500);
            return this.result_;
        }

    }

    ww.Test001 = new Test001();

})();
