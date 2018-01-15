define(function () {

    class CommitRebase {
        constructor(basic) {
            this.Basic = basic;
            this.Name = null;
            this.ActiveDoc = null;
        }

        Read(file) {
            this.Name = file.name;
            this.Basic.EditorCode.editor().setValue(file.code);
            this.ActiveDoc = new ww.Doc(this.Basic.AllocatedID, file.revision, this.Basic.EditorCode);
        }

        CommitDone(revision) {
            this.ActiveDoc.CommitDone(revision);
        }

        Rebase(notification) {
            var serverCommit = new ww.Commit(notification.by_id, notification.for_id, false);
            serverCommit.Revision = notification.revision;
            notification.edits.forEach(function (edit) {
                serverCommit.AppendEdit(new ww.Edit(edit.index, edit.delete, edit.insert));
            });
            this.ActiveDoc.Rebase(serverCommit);
        }

        GetCommitRequest() {
            let request = null;
            if (this.ActiveDoc.Commit(false)) {
                var commit = this.ActiveDoc.CurrentCommit;
                var edits = [];
                commit.Edits.Edits().forEach(function (edit) {
                    edits.push({ "index": edit.Index, "delete": edit.DeleteCount, "insert": edit.Insert });
                });
                request = {
                    //"id": this.ActiveDoc.SyncId, // xxx not needed
                    command: "?commit",
                    target: this.Name,
                    doc_revision: this.ActiveDoc.Revision,
                    revision: commit.Revision,
                    edits: edits
                };
            }
            return request;
        }
    }

    ww.CommitRebase = CommitRebase;

});
