define(function () {
    class Edits {
        constructor(edits = []) {
            this.edits_ = [...edits];
        }

        AnyEdits() {
            return this.edits_.length !== 0;
        }

        Append(nextedit) {
            if (Array.isArray(nextedit)) // ??? is an object
                nextedit.forEach(edit => { this.Append(edit); });
            else if (this.edits_.length === 0 || !this.edits_[this.edits_.length - 1].Combine(nextedit))
                // don't overlap (successfully combined)
                this.edits_.push(nextedit);
        }

        AppendNoCombine(nextedit) {
            if (Array.isArray(nextedit))
                this.edits_ = this.edits_.concat(nextedit);
            else
                this.edits_.push(nextedit);
        }

        Edits() {
            return this.edits_;
        }

        Equals(edits) {
            if (this.edits_.length !== edits.edits_.length)
                return false;

            for (var i = 0; i < this.edits_.length; ++i)
                if (!this.edits_[i].Equals(edits.edits_[i]))
                    return false;

            return true;
        }

        MergeTransform(serverEdits) {
            let mergedEdits = new Edits(this.edits_);
            // apply server Commit to create new Edits
            serverEdits.Edits().forEach(function (serverEdit) {
                // apply each server Edit to create a new merged edits
                let transformedEdits = new Edits();
                mergedEdits.Edits().forEach(edit => {
                    transformedEdits.AppendNoCombine(edit.MergeTransform(serverEdit));
                });

                mergedEdits = transformedEdits;
            });
            return mergedEdits;
        }

        Prepend(prioredit) {
            if (Array.isArray(prioredit)) // ??? is an object
                prioredit.forEach(edit => { this.Prepend(edit); });
            else if (this.edits_.length === 0)
                this.edits_.unshift(prioredit);
            else {
                let edit = prioredit.Copy();
                if (!edit.Combine(this.edits_[0]))
                    this.edits_.unshift(prioredit);
                else
                    this.edits_[0] = edit;
            }
        }
    }

    ww.Edits = Edits;
});
