var ww = ww || {};

(function () {

    // editor.trigger('source - use any string you like', 'editor.action.triggerSuggest', {});
    // editor.trigger('source - use any string you like', 'editor.action.triggerParameterHints', {});

    class Test001 {
        constructor(basic) {
            this.Basic = basic;
        }

        async Run() {
            //await this.Part001();
            //await this.Part002();
            await this.Part003();
        }

        async Part003() {
            let macroname = "\\test003.bas";
            this.result_ = await ww.InputMacro.ReadAsync(macroname);
            let read = this.result_.find(o => o.response === "!read");
            this.Basic.CommitRebase.Read(read.files[0]);
            ww.Test.InsertText(/MsgBox/, "()");
            let request = this.Basic.CommitRebase.GetCommitRequest();
            this.result_ = await this.Basic.Ajax.SendAsync(request, "!commit");
            //this.result_ = await ww.InputMacro.ReadAsync(macroname); // rebase instead ?
            let rebase = this.result_.find(o => o.response === "!rebase");
            //ww.CommitRebase.Rebase(rebase); // not needed for this test
            this.Basic.Test.SetCaret(/MsgBox\(/);
            this.Basic.Test.Editor.trigger('mysource', 'editor.action.triggerParameterHints', {});
            await this.Basic.Test.Wait(500);
            return this.result_;
        }

        async Part002() {
            let macroname = "\\test002.bas";
            this.result_ = await ww.InputMacro.ReadAsync(macroname);
            let read = this.result_.find(o => o.response === "!read");
            this.Basic.CommitRebase.Read(read.files[0]);
            this.Basic.Test.SetCaret(/As /);
            this.Basic.Test.Editor.trigger('mysource', 'editor.action.triggerSuggest', {});
            await this.Basic.Test.Wait(500);
            return this.result_;
        }

        async Part001() {
            let macroname = "\\test001.bas";
            this.result_ = await ww.InputMacro.ReadAsync(macroname);
            let read = this.result_.find(o => o.response === "!read");
            this.Basic.CommitRebase.Read(read.files[0]);
            this.Basic.Test.SetCaret(/'#/);
            this.Basic.Test.Editor.trigger('mysource', 'editor.action.triggerSuggest', {});
            await this.Basic.Test.Wait(500);
            return this.result_;
        }

    }

    ww.Test001 = Test001;

})();
