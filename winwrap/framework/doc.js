define(function () {
    class Doc {
        constructor(sync_id, name, revision, editor) {
            this.sync_id_ = sync_id;
            this.name_ = name;
            this.revision_ = revision;
            this.editor_ = editor;
            // editor object support this methods:
            // applyChange, getText, getSelection and scrollToSelection
            this.need_commit_ = false;
            this.current_commit_ = null;
            this.revision_text_ = this.editor_.getText();
            this.pending_commit_ = new ww.Commit(sync_id, sync_id);
        }

        AppendPendingChange(op, caret) {
            if (op === undefined) {
                op = ww.ChangeOp.ChangeChangeOp;
            }

            if (caret === undefined) {
                caret = this.editor_.getSelection().first;
            }

            let commit = this.pending_commit_;

            if (op === ww.ChangeOp.ChangeChangeOp) {
                // calculate change
                let text = this.editor_.getText();
                let change = ww.Diff(this.revision_text_, text, caret);
                if (change !== null) {
                    commit.AppendChange(change);
                    let revertChange = change.RevertChange(this.revision_text_);
                    commit.PrependRevertChange(revertChange);
                    this.revision_text_ = text;
                }
            }
            else if (op === ww.ChangeOp.EnterChangeOp) {
                let line = this.editor_.getLineFromIndex(caret);
                let range = this.editor_.getLineRange(line - 1);
                commit.AppendChange(new ww.Change(op, range.last, 2));
            }
            else if (op === ww.ChangeOp.FixupChangeOp) {
                let line = this.editor_.getLineFromIndex(caret);
                let range = this.editor_.getLineRange(line - 1);
                commit.AppendChange(new ww.Change(op, range.first, range.last - range.first));
            }
        }

        ApplyChanges(changes, is_server) {
            this.editor_.applyChanges(changes, is_server);
        }

        Commit() {
            if (this.current_commit_ !== null)
                return null;

            this.AppendPendingChange();
            if (!this.pending_commit_.AnyChanges() && !this.need_commit_) {
                return null;
            }

            let need_commit = this.need_commit_;
            this.need_commit_ = false;
            this.current_commit_ = this.pending_commit_.TakeChanges(need_commit);
            this.current_commit_.Log('Current commit:');
            return this.current_commit_;
        }

        CommitDone() {
            if (this.current_commit_ !== null) {
                this.current_commit_.Log('Commit done:');
                this.current_commit_ = null;
            }
        }

        InCommit(name) {
            return name === this.name_ && this.current_commit_ != null;
        }

        Name() {
            return this.name_;
        }

        NeedCommit() {
            this.need_commit_ = true;
        }

        Rebase(serverCommit) {
            if (serverCommit.AnyChanges()) {
                serverCommit.Log('Rebase serverCommit:');
                // make sure all changes have been commited
                this.AppendPendingChange();

                // Rebasing Onto Master(Client - Side) After an operation is transformed and applied server - side,
                // it is broadcasted to the other clients.
                // When a client receives the change, it does the equivalent of a git rebase:
                // 1. Reverts all 'pending' (non - merged) local operations operation from the server
                // 2. Applies remote operation
                // 3. Re-applies pending operations, transforming each operation against the new operation from the server

                // take the pending commits (ApplyChanges below will add them back)
                let pending_commit = this.pending_commit_.TakeChanges();

                if (pending_commit) {
                    // revert pending commit and selection using the pending commit
                    this.ApplyChanges(pending_commit.RevertChanges(), false);
                }

                // rebase text using server commit
                this.ApplyChanges(serverCommit.Changes(), true);

                // update revision text
                this.revision_text_ = this.editor_.getText();

                if (pending_commit) {
                    // rebase pending commit changes using server commit
                    let pending_changes = pending_commit.Changes().MergeTransform(serverCommit.Changes());
                    // apply rebased pending changes
                    this.ApplyChanges(pending_changes, false);
                }
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
