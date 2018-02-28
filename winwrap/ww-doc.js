define(function () {
    class Doc {
        constructor(sync_id, name, revision, editor) {
            this.sync_id_ = sync_id;
            this.name_ = name;
            this.revision_ = revision;
            this.editor_ = editor;
            // editor object support this methods:
            // applyEdit, getText, getSelection and scrollToSelection
            this.need_commit_ = false;
            this.current_commit_ = null;
            this.revision_text_ = this.editor_.getText();
            this.pending_commit_ = new ww.Commit(sync_id, sync_id);
        }

        AppendPendingEdit(op, caret) {
            if (op === undefined) {
                op = ww.EditOp.EditEditOp;
            }

            if (caret === undefined) {
                caret = this.editor_.getSelection().first;
            }

            let commit = this.pending_commit_;

            if (op === ww.EditOp.EditEditOp) {
                // calculate change
                let text = this.editor_.getText();
                let edit = ww.Diff(this.revision_text_, text, caret);
                if (edit !== null) {
                    commit.AppendEdit(edit);
                    let revertEdit = edit.RevertEdit(this.revision_text_);
                    commit.PrependRevertEdit(revertEdit);
                    this.revision_text_ = text;
                }
            }
            else if (op === ww.EditOp.EnterEditOp) {
                let line = this.editor_.getLineFromIndex(caret);
                let range = this.editor_.getLineRange(line - 1);
                commit.AppendEdit(new ww.Edit(op, range.last, 2));
            }
            else if (op === ww.EditOp.FixupEditOp) {
                let line = this.editor_.getLineFromIndex(caret);
                let range = this.editor_.getLineRange(line - 1);
                commit.AppendEdit(new ww.Edit(op, range.first, range.last - range.first));
            }
        }

        ApplyEdits(edits, is_server) {
            this.editor_.applyEdits(edits, is_server);
        }

        Commit() {
            if (this.current_commit_ !== null)
                return null;

            this.AppendPendingEdit();
            if (!this.pending_commit_.AnyEdits() && !this.need_commit_) {
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
            if (serverCommit.AnyEdits()) {
                serverCommit.Log('Rebase serverCommit:');
                // make sure all edits have been commited
                this.AppendPendingEdit();

                // Rebasing Onto Master(Client - Side) After an operation is transformed and applied server - side,
                // it is broadcasted to the other clients.
                // When a client receives the change, it does the equivalent of a git rebase:
                // 1. Reverts all 'pending' (non - merged) local operations operation from the server
                // 2. Applies remote operation
                // 3. Re-applies pending operations, transforming each operation against the new operation from the server

                // take the pending commits (ApplyEdits below will add them back)
                let pending_commit = this.pending_commit_.TakeChanges();

                if (pending_commit) {
                    // revert pending commit and selection using the pending commit
                    this.ApplyEdits(pending_commit.RevertEdits(), false);
                }

                // rebase text using server commit
                this.ApplyEdits(serverCommit.Edits(), true);

                // update revision text
                this.revision_text_ = this.editor_.getText();

                if (pending_commit) {
                    // rebase pending commit edits using server commit
                    let pending_edits = pending_commit.Edits().MergeTransform(serverCommit.Edits());
                    // apply rebased pending edits
                    this.ApplyEdits(pending_edits, false);
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
