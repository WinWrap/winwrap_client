//FILE: commitrebase.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2020 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class CommitRebase {

        constructor(channel) {
            this.Channel = channel;
            this.doc_ = null;
            this.editor_ = undefined;
            channel.AddResponseHandlers({
                commit: response => {
                    this.CommitDone(response);
                },
                rebase: response => {
                    if (!response.visible) {
                        return; // hidden code is manipulated by this implementation
                    }
                    if (this.doc_.InCommit(response.target)) {
                        return; // rebasing self commit - no extra work required
                    }
                    this.doc_.NeedCommit();
                }
            });
        }

        AppendPendingChange(op, caret) {
            this.doc_.AppendPendingChange(op, caret);
        }

        CommitDone(response) {
            let serverChanges = new ww.Changes();
            let pendingCommit = null;
            if (response.success) {
                if (response.target === this.Name()) {
                    response.visible.forEach(change => {
                        serverChanges.AppendNoCombine(new ww.Change(ww.ChangeOp.EditChangeOp, change.index, change.delete, change.insert));
                    });
                    pendingCommit = this.doc_.Rebase(serverChanges);
                    this.doc_.SetRevision(response.revision);
                    if (response.caret_index !== undefined) {
                        this.editor_.SetSelection({ first: response.caret_index, last: response.caret_index } );
                    }
                }
            } else {
                alert('Commit failed.');
            }
            this.doc_.CommitDone();
            if (pendingCommit !== null) {
                // rebase pending commit changes using server commit
                let pendingChanges = pendingCommit.Changes().MergeTransform(serverChanges);
                // apply rebased pending changes
                this.doc_.ApplyChanges(pendingChanges, false);
            }
        }

        HandleSavedResponse(response) {
            this.doc_ = new ww.Doc(this.Channel.AllocatedID, response.name, response.revision, this.editor_);
        }

        Name() {
            return this.doc_ !== null ? this.doc_.Name() : null;
        }

        PushPendingCommit() {
            let commit = this.doc_ !== null ? this.doc_.Commit() : null;
            if (commit !== null) {
                //console.log("Send ?commit request");
                let visibleChanges = [];
                commit.Changes().Changes().forEach(change => {
                    switch (change.Op()) {
                        case ww.ChangeOp.EditChangeOp:
                            visibleChanges.push({ 'op': change.Op(), 'index': change.Index(), 'delete': change.DeleteCount(), 'insert': change.Insert() });
                            break;
                        case ww.ChangeOp.EnterChangeOp:
                        case ww.ChangeOp.FixupChangeOp:
                            visibleChanges.push({ 'op': change.Op(), 'index': change.Index(), 'length': change.DeleteCount() });
                            break;
                    }
                });
                let request = {
                    request: '?commit',
                    target: this.Name(),
                    revision: this.doc_.Revision(),
                    tab_width: 4,
                    tab_as_space: true,
                    visible: visibleChanges
                };
                this.Channel.PushPendingRequest(request);
            }
        }

        Read(file) {
            this.editor_.SetText(file.visible_code);
            this.doc_ = new ww.Doc(this.Channel.AllocatedID, file.name, file.revision, this.editor_);
        }

        SetEditor(editor) {
            this.editor_ = editor;
        }

        async WaitForCommit() {
            if (this.doc !== null) {
                // wait for commit to complete
                this.doc_.WaitForCommit();
            }
        }
    }

    ww.CommitRebase = CommitRebase;

});
