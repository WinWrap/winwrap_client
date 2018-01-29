define(function () {
    class Doc {
        constructor(sync_id, revision, editor) {
            this.sync_id_ = sync_id;
            this.revision_ = revision;
            this.editor_ = editor;
            // editor object support this methods:
            // applyEdit, getText, getSelection and scrollToSelection
            this.need_commit_ = false;
            this.current_commit_ = null;
            this.revision_text_ = this.editor_.getText();
            this.pending_commits_ = [];
        }

        AppendPendingCommit(enter) {
            var text = this.editor_.getText();
            var commit = this.CreateCommit(text, enter);
            if (commit === null)
                return;

            // update revision text
            this.revision_text_ = text;

            if (!commit.Enter() && this.pending_commits_.length > 0) {
                var lastCommit = this.pending_commits_[this.pending_commits_.length - 1];
                if (!lastCommit.Enter()) {
                    lastCommit.Append(commit);
                    lastCommit.Log('pending_commits_: Appended to last pending commit:');
                    commit = null;
                }
            }

            if (commit !== null) {
                commit.Log('pending_commits_: Append pending commit:');
                this.pending_commits_.push(commit);
            }
        }

        ApplyEdits(edits, isserver) {
            var editor = this.editor_;
            edits.Edits().forEach(edit => { editor.applyEdit(edit, isserver); });
        }

        Commit(enter) {
            this.AppendPendingCommit(false);
            if (this.current_commit_ !== null || this.pending_commits_.length === 0)
                return false;

            this.current_commit_ = this.pending_commits_.shift();
            this.current_commit_.Log('Current commit:');
            return true;
        }

        CommitDone() {
            if (this.current_commit_ !== null) {
                this.current_commit_ = null;
            }
        }

        CreateCommit(text, enter) {
            var commit = new ww.Commit(this.sync_id_, this.sync_id_, enter);
            var caret = this.editor_.getSelection().first;
            if (enter) {
                // get current caret
                commit.AppendEditNoCombine(new ww.Edit(caret, 0, ''));
                return commit;
            }

            var edit = ww.Diff(this.revision_text_, text, caret);
            if (edit.IsNull()) {
                if (this.need_commit_) {
                    this.need_commit_ = false;
                } else {
                    commit = null;
                }

                return commit;
            }

            var revertEdit = edit.RevertEdit(this.revision_text_);
            commit.AppendEdit(edit);
            commit.PrependRevertEdit(revertEdit);
            return commit;
        }

        CurrentCommit() {
            return this.current_commit_;
        }

        NeedCommit() {
            this.need_commit_ = true;
        }

        Rebase(serverCommit) {
            serverCommit.Log('Rebase serverCommit:');
            // make sure all edits have been commited
            this.AppendPendingCommit(false);

            // Rebasing Onto Master(Client - Side) After an operation is transformed and applied server - side,
            // it is broadcasted to the other clients.
            // When a client receives the change, it does the equivalent of a git rebase:
            // 1. Reverts all 'pending' (non - merged) local operations operation from the server
            // 2. Applies remote operation
            // 3. Re-applies pending operations, transforming each operation against the new operation from the server

            // take the pending commits and append the future commit
            var pendingCommits = this.pending_commits_;
            this.pending_commits_ = [];

            // revert the pending commits in reverse order
            pendingCommits.reverse();

            // revert code and selection using the pending commits
            pendingCommits.forEach(commit => {
                // revert code
                this.ApplyEdits(commit.RevertEdits(), false);
            });

            // rebase text using server commit
            this.ApplyEdits(serverCommit.Edits(), true);

            // update revision
            this.SetRevision(serverCommit.revision);

            // update revision text
            this.revision_text_ = this.editor_.getText();

            // restore original commit order
            pendingCommits.reverse();

            // rebase the pending commits using the server commit
            pendingCommits.forEach(commit => {
                // rebase commit changes using the server commit and apply
                var mergedEdits = commit.Edits().MergeTransform(serverCommit.Edits());
                this.ApplyEdits(mergedEdits, false);

                // append commit based on the rebase changes result
                this.AppendPendingCommit(commit.Enter());
            });

            // scroll to selection
            if (serverCommit.caret_index) {
                this.editor_.setSelection(serverCommit.caret_index, serverCommit.caret_index);
            }
        }

        Revision() {
            return this.revision_;
        }

        SetRevision(revision) {
            this.revision_ = revision;
        }
    }

    ww.Doc = Doc;
});
