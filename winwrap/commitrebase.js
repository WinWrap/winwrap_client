define(function () {

    class CommitRebase {
        constructor(channel) {
            this.Channel = channel;
            this.ActiveDoc = null;
        }

        SetEditor(editor) {
            this.Editor = editor;
        }

        Read(file) {
            this.Editor.editor().setValue(file.code);
            this.ActiveDoc = new ww.Doc(this.Channel.AllocatedID, file.name, file.revision, this.Editor);
        }

        CommitDone(response) {
            if (response.success) {
                response.commits.forEach(commit => {
                    if (commit.by_id !== this.Channel.AllocatedID) {
                        let serverCommit = new ww.Commit(commit.by_id, commit.for_id, false);
                        commit.edits.forEach(edit => {
                            serverCommit.AppendEdit(new ww.Edit(ww.EditOp.EditEditOp, edit.index, edit.delete, edit.insert));
                        });
                        this.ActiveDoc.Rebase(serverCommit);
                    }
                    this.ActiveDoc.SetRevision(commit.revision);
                });
            } else {
                alert('Commit failed.');
            }
            this.ActiveDoc.CommitDone();
        }

        Rebase(notification) {
            if (notification.for_id === this.Channel.AllocatedID && this.ActiveDoc.InCommit(notification.target)) {
                return; // rebasing self commit - no extra work required
            }
            this.ActiveDoc.NeedCommit();
        }

        GetCommitRequest() {
            let request = null;
            var commit = this.ActiveDoc.Commit();
            if (commit !== null) {
                //console.log("Send ?commit request");
                let edits = [];
                if (!commit.IsNull()) {
                    commit.Edits().Edits().forEach(edit => {
                        if (edit.Op() === ww.EditOp.EditEditOp) {
                            edits.push({ 'op': edit.Op(), 'index': edit.Index(), 'delete': edit.DeleteCount(), 'insert': edit.Insert() });
                        } else if (edit.Op() === ww.EditOp.EnterEditOp || edit.Op() === ww.EditOp.FixupEditOp) {
                            edits.push({ 'op': edit.Op(), 'index': edit.Index(), 'length': edit.DeleteCount() });
                        }
                    });
                }
                request = {
                    command: '?commit',
                    target: this.ActiveDoc.Name(),
                    revision: this.ActiveDoc.Revision(),
                    edits: edits
                };
            }
            return request;
        }
    }

    ww.CommitRebase = CommitRebase;

});
