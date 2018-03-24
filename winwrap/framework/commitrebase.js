//FILE: commitrebase.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class CommitRebase {

        constructor(channel) {
            this.Channel = channel;
            this.doc_ = null;
            let this_ = this; // closure can't handle this in the lambdas below
            channel.AddResponseHandlers({
                commit: response => {
                    this_.CommitDone(response);
                },
                rebase: response => {
                    if (!response.visible) {
                        return; // hidden code is manipulated by this implementation
                    }
                    if (this_.doc_.InCommit(response.target)) {
                        return; // rebasing self commit - no extra work required
                    }
                    this_.doc_.NeedCommit();
                }
            });
        }

        SetEditor(editor) {
            this.editor_ = editor;
        }

        AppendPendingChange(op, caret) {
            this.doc_.AppendPendingChange(op, caret);
        }

        CommitDone(response) {
            if (response.success) {
                if (response.target === this.Name()) {
                    let serverChanges = new ww.Changes();
                    response.visible.forEach(change => {
                        serverChanges.AppendNoCombine(new ww.Change(ww.ChangeOp.EditChangeOp, change.index, change.delete, change.insert));
                    });
                    this.doc_.Rebase(serverChanges);
                    this.doc_.SetRevision(response.revision);
                    if (response.caret_index !== undefined) {
                        this.editor_.SetSelection({ first: response.caret_index, last: response.caret_index } );
                    }
                }
            } else {
                alert('Commit failed.');
            }
            this.doc_.CommitDone();
        }

        GetCommitRequest() {
            let request = null;
            let commit = this.doc_.Commit();
            if (commit !== null) {
                //console.log("Send ?commit request");
                let visibleChanges = [];
                if (commit.AnyChanges()) {
                    commit.Changes().Changes().forEach(change => {
                        if (change.Op() === ww.ChangeOp.EditChangeOp) {
                            visibleChanges.push({ 'op': change.Op(), 'index': change.Index(), 'delete': change.DeleteCount(), 'insert': change.Insert() });
                        } else if (change.Op() === ww.ChangeOp.EnterChangeOp || change.Op() === ww.ChangeOp.FixupChangeOp) {
                            visibleChanges.push({ 'op': change.Op(), 'index': change.Index(), 'length': change.DeleteCount() });
                        }
                    });
                }
                request = {
                    command: '?commit',
                    target: this.Name(),
                    revision: this.doc_.Revision(),
                    tab_width: 4,
                    tab_as_space: true,
                    visible: visibleChanges
                };
            }
            return request;
        }

        Name() {
            return this.doc_ !== null ? this.doc_.Name() : null;
        }

        Read(file) {
            this.editor_.SetText(file.visible_code);
            this.doc_ = new ww.Doc(this.Channel.AllocatedID, file.name, file.revision, this.editor_);
        }
    }

    ww.CommitRebase = CommitRebase;

});
