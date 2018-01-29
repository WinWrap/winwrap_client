define(function () {
    class Commit {
        // by_sync_id: sync id that creates the commit (0 for server)
        // for_sync_id: sync id that caused the commit (never 0)
        constructor(by_sync_id, for_sync_id, enter) {
            this.by_sync_id_ = by_sync_id;
            this.for_sync_id_ = for_sync_id;
            this.enter_ = enter;
            this.edits_ = new ww.Edits();
            this.revert_edits_ = new ww.Edits();
        }

        Append(nextcommit)
        {
            this.edits_.Append(nextcommit.edits_);
            // revert changes are stored first revert change to last revert change
            // this commit's revert changes occur after nextcommit's revert changes
            var revertEdits = new ww.edits_(nextcommit.revert_edits_);
            this.revert_edits_.forEach(revertEdit => { revertEdits.Append(revertEdit); });
            this.revert_edits_ = revertEdits;
        }

        AppendEdit(nextedit) {
            this.edits_.Append(nextedit);
        }

        AppendEditNoCombine(nextedit) {
            this.edits_.AppendNoCombine(nextedit);
        }

        AppendEdits(edits) {
            this.edits_.Append(edits);
        }

        Apply(text) {
            return this.edits_.Apply(text);
        }

        BySyncId() {
            return this.by_sync_id_;
        }

        Copy() {
            var commit = new Commit(this.by_sync_id_, this.for_sync_id_, this.enter_);
            commit.edits_ = this.edits_.Copy();
            commit.ReverEdits = this.revert_edits_.Copy();
            return commit;
        }

        Edits() {
            return this.edits_;
        }

        Enter() {
            return this.enter_;
        }

        ForSyncId() {
            return this.for_sync_id_;
        }

        MergeTransform(serverCommit) {
            var mergedEdits = this.edits_.MergeTransform(serverCommit.edits_);
            if (mergedEdits.IsNull())
                return null;

            var commit = new Commit(this.by_sync_id_, this.for_sync_id_, this.enter_);
            commit.AppendEdits(mergedEdits);
            return commit;
        }

        PrependRevertEdit(prioredit) {
            this.revert_edits_.Prepend(prioredit);
        }

        RevertEdits() {
            return this.revert_edits_;
        }
            
        Log(title) {
            //console.log(title);
            //console.log(this);
        }
    }

    ww.Commit = Commit;
});
