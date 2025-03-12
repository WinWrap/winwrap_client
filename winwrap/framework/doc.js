//FILE: doc.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2020 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class Doc {

        constructor(sync_id, name, revision, hidden_code, editor) {
            this.sync_id_ = sync_id;
            this.name_ = name;
            this.revision_ = revision;
            this.hidden_code_ = hidden_code;
            this.editor_ = editor;
            // editor object support this methods:
            // applyChange, getText, getSelection and scrollToSelection
            this.need_commit_ = false;
            this.current_commit_ = null;
            this.revision_text_ = this.editor_.GetText();
            this.pending_commit_ = new ww.Commit(sync_id, sync_id);
        }

        AppendPendingChange(op, caret) {
            if (op === undefined) {
                op = ww.ChangeOp.EditChangeOp;
            }

            if (caret === undefined) {
                caret = this.editor_.GetSelection().first;
            }

            let commit = this.pending_commit_;

            switch (op) {
                case ww.ChangeOp.EditChangeOp:
                    // calculate change
                    let text = this.editor_.GetText();
                    let change = ww.Diff(this.revision_text_, text, caret);
                    if (change !== null) {
                        change = ww.Diff(this.revision_text_, text, caret);
                        commit.AppendChange(change);
                        let revertChange = change.RevertChange(this.revision_text_);
                        commit.PrependRevertChange(revertChange);
                        this.revision_text_ = text;
                    }
                    break;
                case ww.ChangeOp.EnterChangeOp:
                case ww.ChangeOp.FixupChangeOp:
                    let range = this.editor_.GetIndexRangeOfLineAt(caret);
                    commit.AppendChange(new ww.Change(op, range.first - 2, 2));
            }
        }

        ApplyChanges(changes, is_server) {
            changes.Changes().forEach(change => {
                if (change.Op() === ww.ChangeOp.EditChangeOp) {
                    this.editor_.ApplyChange(change, is_server);
                }
                else {
                    this.AppendPendingChange(ww.ChangeOp.EditChangeOp);
                    this.pending_commit_.AppendChange(change);
                }
            });
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
            this.current_commit_ = this.pending_commit_.TakeChangesAsNewCommit(need_commit);
            this.current_commit_.Log('Current commit:');
            return this.current_commit_;
        }

        CommitDone() {
            if (this.current_commit_ !== null) {
                this.current_commit_.Log('Commit done:');
                this.current_commit_ = null;
            }
        }

        GetHiddenCode() {
            return this.hidden_code_;
        }

        InCommit(name) {
            return name === this.name_ && this.current_commit_ !== null;
        }

        Name() {
            return this.name_;
        }

        NeedCommit() {
            this.need_commit_ = true;
        }

        Rebase(serverChanges) {
            let pending_commit = null;
            if (serverChanges.AnyChanges()) {
                // make sure all changes have been commited
                this.AppendPendingChange();

                // Rebasing Onto Master(Client - Side) After an operation is transformed and applied server - side,
                // it is broadcasted to the other clients.
                // When a client receives the change, it does the equivalent of a git rebase:
                // 1. Reverts all 'pending' (non - merged) local operations operation from the server
                // 2. Applies remote operation
                // 3. Re-applies pending operations, transforming each operation against the new operation from the server

                // take the pending commits (ApplyChanges below will add them back)
                pending_commit = this.pending_commit_.TakeChangesAsNewCommit();

                if (pending_commit) {
                    // revert pending commit and selection using the pending commit
                    this.ApplyChanges(pending_commit.RevertChanges(), false);
                }

                // rebase text using server commit
                this.ApplyChanges(serverChanges, true);

                // update revision text
                this.revision_text_ = this.editor_.GetText();
            }

            return pending_commit;
        }

        Revision() {
            return this.revision_;
        }

        SetHiddenCode(hidden_code) {
            this.hidden_code_ = hidden_code;
        }

        SetRevision(revision) {
            this.revision_ = revision;
        }

        async WaitForCommit() {
            for (var i = 0; i < 20 && this.current_commit_ !== null; ++i) {
                await _Wait(100);
            }
        }

        _Wait(ms) {
            return new Promise(r => setTimeout(r, ms));
        }
    }

    ww.Doc = Doc;

});
