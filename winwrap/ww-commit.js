define(function () {
    class Commit {
        // by_sync_id: sync id that creates the commit (0 for server)
        // for_sync_id: sync id that caused the commit (never 0)
        constructor(by_sync_id, for_sync_id, enter) {
            this.BySyncId = by_sync_id;
            this.ForSyncId = for_sync_id;
            this.Enter = enter;
            this.Revision = 0;
            this.Edits = new ww.Edits();
            this.RevertEdits = new ww.Edits();
        }

        Append(nextcommit)
        {
            this.Edits.Append(nextcommit.Edits);
            // revert changes are stored first revert change to last revert change
            // this commit's revert changes occur after nextcommit's revert changes
            var revertEdits = new ww.Edits(nextcommit.RevertEdits);
            this.RevertEdits.forEach(function (revertEdit) { revertEdits.Append(revertEdit); });
            this.RevertEdits = revertEdits;
        }

        AppendEdit(nextedit) {
            this.Edits.Append(nextedit);
        }

        AppendEditNoCombine(nextedit) {
            this.Edits.AppendNoCombine(nextedit);
        }

        AppendEdits(edits) {
            this.Edits.Append(edits);
        }

        Apply(text) {
            return this.Edits.Apply(text);
        }

        Copy() {
            var commit = new Commit(this.BySyncId, this.ForSyncId, this.Enter);
            commit.Edits = this.Edits.Copy();
            commit.ReverEdits = this.RevertEdits.Copy();
            return commit;
        }

        MergeTransform(serverCommit) {
            var mergedEdits = this.Edits.MergeTransform(serverCommit.Edits);
            if (mergedEdits.IsNull())
                return null;

            var commit = new Commit(this.BySyncId, this.ForSyncId, this.Enter);
            commit.AppendEdits(mergedEdits);
            return commit;
        }

        PrependRevertEdit(prioredit) {
            this.RevertEdits.Prepend(prioredit);
        }
            
        Use(revision) {
            // 1 <= revision <= int.MaxValue
            if (revision > this.Revision)
                revision -= 0x7fffffff;

            var delta = this.Revision - revision;
            return delta < 0x40000000;
        }
    }

    ww.Commit = Commit;
});
