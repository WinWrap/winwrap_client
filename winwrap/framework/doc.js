//FILE: doc.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

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

            if (op === ww.ChangeOp.EditChangeOp) {
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
            }
            else if (op === ww.ChangeOp.EnterChangeOp) {
                let range = this.editor_.GetIndexRangeOfLineAt(caret);
                commit.AppendChange(new ww.Change(op, range.first - 2, 2));
            }
            else if (op === ww.ChangeOp.FixupChangeOp) {
                let range = this.editor_.GetIndexRangeOfLineAt(caret);
                commit.AppendChange(new ww.Change(op, range.first, range.last - range.first));
            }
        }

        ApplyChanges(changes, is_server) {
            this.editor_.ApplyChanges(changes, is_server);
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

        Rebase(serverChanges) {
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
                let pending_commit = this.pending_commit_.TakeChanges();

                if (pending_commit) {
                    // revert pending commit and selection using the pending commit
                    this.ApplyChanges(pending_commit.RevertChanges(), false);
                }

                // rebase text using server commit
                this.ApplyChanges(serverChanges, true);

                // update revision text
                this.revision_text_ = this.editor_.GetText();

                if (pending_commit) {
                    // rebase pending commit changes using server commit
                    let pending_changes = pending_commit.Changes().MergeTransform(serverChanges);
                    // apply rebased pending changes
                    this.ApplyChanges(pending_changes, false);
                }
            }
        }

        Rename(name) {
            this.name_ = name;
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
