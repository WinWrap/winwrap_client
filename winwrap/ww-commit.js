define(function () {
    class Commit {
        constructor() {
            this.edits_ = new ww.Edits();
            this.revert_edits_ = new ww.Edits();
        }

        AnyEdits() {
            return this.edits_.AnyEdits();
        }

        AppendEdit(nextedit) {
            this.edits_.Append(nextedit);
        }

        AppendEdits(edits) {
            this.edits_.Append(edits);
        }

        Edits() {
            return this.edits_;
        }

        PrependRevertEdit(prioredit) {
            this.revert_edits_.Prepend(prioredit);
        }

        RevertEdits() {
            return this.revert_edits_;
        }
            
        TakeChanges(need_commit) {
            let commit = null;
            if (this.AnyEdits() || need_commit) {
                commit = new Commit();
                commit.edits_ = this.edits_;
                this.edits_ = new ww.Edits();
                commit.revert_edits_ = this.revert_edits_;
                this.revert_edits_ = new ww.Edits();
            }

            return commit;
        }

        Log(title) {
            //console.log(title);
            //console.log(this);
        }
    }

    ww.Commit = Commit;
});
