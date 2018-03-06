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
                    response.visible.forEach(edit => {
                        serverCommit.AppendEdit(new ww.Edit(ww.EditOp.EditEditOp, edit.index, edit.delete, edit.insert));
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
                let visibleEdits = [];
                if (commit.AnyEdits()) {
                    commit.Edits().Edits().forEach(edit => {
                        if (edit.Op() === ww.EditOp.EditEditOp) {
                            visibleEdits.push({ 'op': edit.Op(), 'index': edit.Index(), 'delete': edit.DeleteCount(), 'insert': edit.Insert() });
                        } else if (edit.Op() === ww.EditOp.EnterEditOp || edit.Op() === ww.EditOp.FixupEditOp) {
                            visibleEdits.push({ 'op': edit.Op(), 'index': edit.Index(), 'length': edit.DeleteCount() });
                        }
                    });
                }
                request = {
                    command: '?commit',
                    target: this.ActiveDoc.Name(),
                    revision: this.ActiveDoc.Revision(),
                    tab_width: 4,
                    tab_as_space: true,
                    visible: visibleEdits
                };
            }
            return request;
        }

        Read(file) {
            this.Editor.editor().setValue(file.visible_code);
            this.Editor.editor().setScrollTop(0);
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
