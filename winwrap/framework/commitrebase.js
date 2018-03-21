define(function () {

    class CommitRebase {
        constructor(channel) {
            this.Channel = channel;
            this.ActiveDoc = null;
        }

        SetEditor(editor) {
            this.Editor = editor;
        }

        CommitDone(response) {
            if (response.success) {
                if (response.target === this.ActiveDoc.Name()) {
                    let serverCommit = new ww.Commit();
                    response.visible.forEach(change => {
                        serverCommit.AppendChange(new ww.Change(ww.ChangeOp.ChangeChangeOp, change.index, change.delete, change.insert));
                    });
                    this.ActiveDoc.Rebase(serverCommit);
                    this.ActiveDoc.SetRevision(response.revision);
                    if (response.caret_index !== undefined) {
                        this.Editor.editor().setSelection(response.caret_index);
                    }
                }
            } else {
                alert('Commit failed.');
            }
            this.ActiveDoc.CommitDone();
        }

        GetCommitRequest() {
            let request = null;
            let commit = this.ActiveDoc.Commit();
            if (commit !== null) {
                //console.log("Send ?commit request");
                let visibleChanges = [];
                if (commit.AnyChanges()) {
                    commit.Changes().Changes().forEach(change => {
                        if (change.Op() === ww.ChangeOp.ChangeChangeOp) {
                            visibleChanges.push({ 'op': change.Op(), 'index': change.Index(), 'delete': change.DeleteCount(), 'insert': change.Insert() });
                        } else if (change.Op() === ww.ChangeOp.EnterChangeOp || change.Op() === ww.ChangeOp.FixupChangeOp) {
                            visibleChanges.push({ 'op': change.Op(), 'index': change.Index(), 'length': change.DeleteCount() });
                        }
                    });
                }
                request = {
                    command: '?commit',
                    target: this.ActiveDoc.Name(),
                    revision: this.ActiveDoc.Revision(),
                    tab_width: 4,
                    tab_as_space: true,
                    visible: visibleChanges
                };
            }
            return request;
        }

        Read(file) {
            let editor = this.Editor.editor();
            editor.setValue(file.visible_code);
            //editor.setScrollTop(0);
            editor.revealLine(1);
            this.ActiveDoc = new ww.Doc(this.Channel.AllocatedID, file.name, file.revision, this.Editor);
        }

        Rebase(notification) {
            if (!notification.visible) {
                return; // hidden code is manipulated by this implementation
            }
            if (this.ActiveDoc.InCommit(notification.target)) {
                return; // rebasing self commit - no extra work required
            }
            this.ActiveDoc.NeedCommit();
        }

    }

    ww.CommitRebase = CommitRebase;

});
