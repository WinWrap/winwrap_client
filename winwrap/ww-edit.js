var ww = ww || {};

(function () {
    class Edit {
        constructor(index, deletecount, insert) {
            this.Index = index;
            this.DeleteCount = deletecount;
            this.Insert = insert;
        }

        Copy() {
            return new Edit(this.Index, this.DeleteCount, this.Insert);
        }

        DeleteIndex() {
            return this.Index + this.DeleteCount;
        }

        Delta() {
            return this.InsertLength() - this.DeleteCount;
        }

        Edit() {
            return this.Index + this.InsertLength();
        }

        InsertIndex() {
            return this.Index + this.InsertLength();
        }

        InsertLength() {
            return this.Insert === undefined ? 0 : this.Insert.length;
        }

        IsNull() {
            return this.DeleteCount == 0 && (this.Insert === undefined || this.Insert == "");
        }

        Equals(edit) {
            return this.Index == edit.Index && this.DeleteCount == edit.DeleteCount && this.Insert == edit.Insert;
        }

        AdjustCaret(x, isserver) {
            // server operation at Index does not adjust the caret
            if (isserver ? x > this.Index : x >= this.Index) {
                if (x >= this.DeleteIndex())
                    x += this.Delta(); // shift by change's delta
                else if (isserver)
                    x = this.Index; // move to front of change
                else
                    x = this.InsertIndex(); // move to end of change
            }

            return x;
        }

        Apply(text) {
            return text.substring(0, this.Index) + this.Insert + text.substring(this.Index + this.DeleteCount);
        }

        CanCombine(nextedit) {
            return this.Index <= nextedit.DeleteIndex() && nextedit.Index <= this.InsertIndex();
        }

        Combine(nextedit) {
            if (!this.CanCombine(nextedit))
                return false;

            var iIndex = 0;
            var iDelete = nextedit.DeleteCount;
            var sInsert = "";
            var iThisInsertLength = this.InsertLength();

            // this is the prior edit
            var iPriorInsertHeadCount = 0;
            var iPriorInsertTailCount = 0;
            if (nextedit.Index < this.Index) {
                // next edit is left of this (prior) edit
                iIndex = nextedit.Index;
                iPriorInsertHeadCount = 0;
                var iKeepDelete = this.Index - iIndex;
                var iPriorInsertDelete = iDelete - iKeepDelete;
                if (iPriorInsertDelete > iThisInsertLength)
                    iPriorInsertDelete = iThisInsertLength;

                iDelete -= iPriorInsertDelete;
                iPriorInsertTailCount = iThisInsertLength - iPriorInsertDelete;
            }
            else {
                // next edit is at or right of this (prior) edit
                iIndex = this.Index;
                iPriorInsertHeadCount = nextedit.Index - iIndex;
                if (iPriorInsertHeadCount > iThisInsertLength)
                    iPriorInsertHeadCount = iThisInsertLength;

                iPriorInsertTailCount = iThisInsertLength - iPriorInsertHeadCount;
                if (iDelete < iPriorInsertTailCount) {
                    // all of next edit's delete count goes to the this (prior) edit's insert
                    // some of the this (prior) edit's insert is still inserted (tail portion)
                    iPriorInsertTailCount -= iDelete;
                    iDelete = 0;
                }
                else {
                    // some of the next edit's delete goes to the constructed edit
                    // none of the this (prior) edit's insert beyond the head portion is retained
                    iDelete -= iPriorInsertTailCount;
                    iPriorInsertTailCount = 0;
                }
            }

            // left portion of this (prior) edit's insert
            if (iPriorInsertHeadCount > 0)
                sInsert += this.Insert.substring(0, iPriorInsertHeadCount);

            // all of next edit's insert
            sInsert += nextedit.Insert;

            // right portion of this (prior) edit's insert
            if (iPriorInsertTailCount > 0)
                sInsert += this.Insert.substring(iThisInsertLength - iPriorInsertTailCount);

            // all of this (prior) edit's delete count
            iDelete += this.DeleteCount;

            this.Index = iIndex;
            this.DeleteCount = iDelete;
            this.Insert = sInsert;
            return true;
        }

        MergeTransform(serverEdit) {
            var beforeEdit = new Edit(0, 0, "");
            var afterEdit = new Edit(0, 0, "");
            if (this.DeleteIndex() < serverEdit.Index) {
                // entirely before serverEdit
                beforeEdit = this.Copy();
            }
            else if (this.Index >= serverEdit.DeleteIndex()) {
                // entirely after serverEdit
                afterEdit = this.Copy();
                afterEdit.Index += serverEdit.Delta();
            }
            else {
                // overlaps
                if (this.Index < serverEdit.Index) {
                    // overlaps start - split into two
                    beforeEdit.Index = this.Index;
                    beforeEdit.DeleteCount = serverEdit.Index - this.Index;

                    afterEdit.Index = serverEdit.InsertIndex();
                    afterEdit.DeleteCount = this.DeleteCount - beforeEdit.DeleteCount - serverEdit.DeleteCount;
                    if (afterEdit.DeleteCount < 0)
                        afterEdit.DeleteCount = 0;

                    // shift after edit forward
                    afterEdit.Index -= beforeEdit.DeleteCount;
                    if (afterEdit.Index == beforeEdit.Index) {
                        // merge into after edit - remove before edit
                        afterEdit.DeleteCount += beforeEdit.DeleteCount;
                        beforeEdit.DeleteCount = 0;
                    }
                }
                else {
                    // overlap end or subset
                    afterEdit.Index = serverEdit.InsertIndex();
                    afterEdit.DeleteCount = this.DeleteIndex() - serverEdit.DeleteIndex();
                    if (afterEdit.DeleteCount < 0)
                        afterEdit.DeleteCount = 0;
                    else if (afterEdit.DeleteCount > this.DeleteCount)
                        afterEdit.DeleteCount = this.DeleteCount;
                }

                afterEdit.Insert = this.Insert;
            }

            var edits = [];
            if (!beforeEdit.IsNull())
                edits.push(beforeEdit);

            if (!afterEdit.IsNull())
                edits.push(afterEdit);

            return edits;
        }

        RevertEdit(s0) {
            return new Edit(this.Index, this.InsertLength(), s0.substring(this.Index, this.DeleteIndex()));
        }

        toString() {
            return this.Index + "-" + this.DeleteCount + "'" + this.Insert + "'";
        }
    }

    ww.Edit = Edit;

    ww.Diff = function (s0, s1, hint) {
        var len0 = s0.length;
        var len1 = s1.length;
        if (len0 == len1 && s0 == s1)
            return new Edit(len0, 0, "");

        var min = Math.min(len0, len1);
        var offset = 0;
        var guard = hint < 100 ? 5 : 50;
        if (hint >= guard && hint < min - guard) {
            var hint0 = len0 == min ? hint : hint + len0 - len1;
            var hint1 = len1 == min ? hint : hint + len1 - len0;
            if (s0.substring(0, hint - guard) == s1.substring(0, hint - guard) &&
                s0.substring(hint0 + guard) == s1.substring(hint1 + guard)) {
                // leading strings match from to hint - guard
                // trailing strings match from hint0 + guard and hint1 + guard
                offset = hint - guard;
                s0 = s0.substring(offset, hint0 + guard);
                s1 = s1.substring(offset, hint1 + guard);
            }
        }

        var index = 0;
        while (index < min) {
            if (s0.charAt(index) != s1.charAt(index))
                break;
            ++index;
        }

        var i0 = len0;
        var i1 = len1;
        while (i0 > index && i1 > index) {
            if (s0.charAt(i0 - 1) != s1.charAt(i1 - 1))
                break;
            --i0;
            --i1;
        }

        var deletecount = i0 - index;
        var insert = s1.substring(index, i1);
        return new Edit(index + offset, deletecount, insert);
    };
})();
