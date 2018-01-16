define(function () {
    class Edits {
        constructor(edits = []) {
            this.edits_ = [...edits];
        }

        IsNull() {
            return this.edits_.length == 0;
        }

        AdjustSelection(selection, isserver) {
            this.edits_.forEach(function (edit) {
                selection.first = edit.AdjustCaret(selection.first, isserver);
                selection.last = edit.AdjustCaret(selection.last, isserver);
            });
        }

        Append(nextedit) {
            if (Array.isArray(nextedit)) // ??? is an object
                nextedit.forEach(function (edit) { this.Append(edit); });
            else if (this.edits_.length == 0 || !this.edits_[this.edits_.length - 1].Combine(nextedit))
                // don't overlap (successfully combined)
                this.edits_.push(nextedit);
        }

        AppendNoCombine(nextedit) {
            if (Array.isArray(nextedit))
                this.edits_ = this.edits_.concat(nextedit);
            else
                this.edits_.push(nextedit);
        }

        Apply(text) {
            this.edits_.forEach(function (edit) { text = edit.Apply(text); });
            return text;
        }

        Copy() {
            var edits = new Edits();
            edits.edits = [...this.edits_];
            return edits;
        }

        Edits() {
            return this.edits_;
        }

        Equals(edits) {
            if (this.edits_.length != edits.edits_.length)
                return false;

            var i;
            for (i = 0; i < this.edits_.length; ++i)
                if (!this.edits_[i].Equals(edits.edits_[i]))
                    return false;

            return true;
        }

        MergeTransform(serverEdits) {
            var mergedEdits = new Edits(this);
            // apply server Commit to create new Edits
            serverEdits.forEach(function (serverEdit) {
                // apply each server Edit to create a new merged edits
                var transformedEdits = new Edits();
                mergedEdits.forEach(function (edit) {
                    transformedEdits.AppendNoCombine(edit.MergeTransform(serverEdit));
                });

                mergedEdits = transformedEdits;
            });
            return mergedEdits;
        }

        Prepend(prioredit) {
            if (Array.isArray(prioredit)) // ??? is an object
                prioredit.forEach(function (edit) { this.Prepend(edit); });
            else if (this.edits_.length == 0)
                this.edits_.unshift(prioredit);
            else {
                var edit = prioredit.Copy();
                if (!edit.Combine(this.edits_[0]))
                    this.edits_.unshift(prioredit);
                else
                    this.edits_[0] = edit;
            }
        }
    }

    ww.Edits = Edits;
});
