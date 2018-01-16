define(function () {
    class Doc {
        constructor(sync_id, revision, editor) {
            this.SyncId = sync_id;
            this.Revision = revision;
            this.editor_ = editor;
            // editor object support this methods:
            // applyEdit, getText, getSelection and scrollToSelection
            this.CurrentCommit = null;
            this.revisionText_ = this.editor_.getText();
            this.pendingCommits_ = [];
        }

        AppendPendingCommit(enter) {
            var text = this.editor_.getText();
            var commit = this.CreateCommit(text, enter);
            if (commit === null)
                return;

            // update revision text
            this.revisionText_ = text;

            if (!commit.Enter && this.pendingCommits_.length > 0) {
                var lastCommit = this.pendingCommits_[this.pendingCommits_.length - 1];
                if (!lastCommit.Enter) {
                    lastCommit.Append(commit);
                    commit = null;
                }
            }

            if (commit !== null)
                this.pendingCommits_.push(commit);
        }

        ApplyEdits(edits, isserver) {
            var editor = this.editor_;
            edits.Edits().forEach(function (edit) { editor.applyEdit(edit, isserver); });
        }

        Commit(enter) {
            this.AppendPendingCommit(false);
            if (this.CurrentCommit != null || this.pendingCommits_.length == 0)
                return false;

            this.CurrentCommit = this.pendingCommits_.shift();
            this.CurrentCommit.Revision = this.Revision;
            return true;
        }

        CommitDone(revision) {
            if (this.CurrentCommit != null) {
                this.CurrentCommit = null;
                this.Revision = revision;
            }
        }

        CreateCommit(text, enter) {
            var commit = new ww.Commit(this.SyncId, this.SyncId, enter);
            var caret = this.editor_.getSelection().first;
            if (enter) {
                // get current caret
                commit.AppendEditNoCombine(new ww.Edit(caret, 0, ''));
                return commit;
            }

            var edit = ww.Diff(this.revisionText_, text, caret);
            if (edit.IsNull())
                return null;

            var revertEdit = edit.RevertEdit(this.revisionText_);
            commit.AppendEdit(edit);
            commit.PrependRevertEdit(revertEdit);
            return commit;
        }

        Rebase(serverCommit) {
            if (serverCommit.BySyncId === this.SyncId) {
                // my commit, already applied to client
                this.CommitDone(serverCommit.Revision); // xyz
                return;
            }

            // make sure all edits have been commited
            this.AppendPendingCommit(false);

            // Rebasing Onto Master(Client - Side) After an operation is transformed and applied server - side,
            // it is broadcasted to the other clients.
            // When a client receives the change, it does the equivalent of a git rebase:
            // 1. Reverts all 'pending' (non - merged) local operations operation from the server
            // 2. Applies remote operation
            // 3. Re-applies pending operations, transforming each operation against the new operation from the server

            // take the pending commits and append the future commit
            var pendingCommits = this.pendingCommits_;
            this.pendingCommits_ = [];

            // revert the pending commits in reverse order
            pendingCommits.reverse();

            // revert code and selection using the pending commits
            pendingCommits.forEach(function (commit) {
                // revert code
                this.ApplyEdits(commit.RevertEdits, false);
            });

            // rebase text using server commit
            this.ApplyEdits(serverCommit.Edits, true);

            // update revision
            this.Revision = serverCommit.Revision;

            // update revision text
            this.revisionText_ = this.editor_.getText();

            // restore original commit order
            pendingCommits.reverse();

            // rebase the pending commits using the server commit
            pendingCommits.forEach(function (commit) {
                // rebase commit changes using the server commit and apply
                var mergedEdits = commit.Edits.MergeTransform(serverCommit.Edits);
                this.ApplyEdits(mergedEdits, false);

                // append commit based on the rebase changes result
                this.AppendPendingCommit(commit.Enter);
            });

            // scroll to selection
            if (serverCommit.ForSyncId == this.SyncId)
                this.editor_.scrollToSelection();
        }
    }

    ww.Doc = Doc;
});
