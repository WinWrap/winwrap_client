define(function () {

    class CommitRebase {
        constructor(channel) {
            this.Channel = channel;
            this.Name = null;
            this.ActiveDoc = null;
        }

        SetEditor(editor) {
            this.Editor = editor;
        }

        Read(file) {
            this.Name = file.name;
            this.Editor.editor().setValue(file.code);
            this.ActiveDoc = new ww.Doc(this.Channel.AllocatedID, file.revision, this.Editor);
        }

        CommitDone(response) {
            if (response.success) {
                response.commits.forEach(commit => {
                    if (commit.by_id !== this.Channel.AllocatedID) {
                        let serverCommit = new ww.Commit(commit.by_id, commit.for_id, false);
                        commit.edits.forEach(edit => {
                            serverCommit.AppendEdit(new ww.Edit(edit.index, edit.delete, edit.insert));
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
            if (notification.by_id !== this.Channel.AllocatedID && notification.target === this.Name) {
                this.ActiveDoc.NeedCommit();
            }
        }

        GetCommitRequest() {
            let request = null;
            if (this.ActiveDoc.Commit(false)) {
                //console.log("Commit needed");
                var commit = this.ActiveDoc.CurrentCommit();
                var edits = [];
                commit.Edits().Edits().forEach(edit => {
                    edits.push({ 'index': edit.Index(), 'delete': edit.DeleteCount(), 'insert': edit.Insert() });
                });
                request = {
                    command: '?commit',
                    target: this.Name,
                    revision: this.ActiveDoc.Revision(),
                    edits: edits
                };
            }
            return request;
        }
    }

    ww.CommitRebase = CommitRebase;

});
