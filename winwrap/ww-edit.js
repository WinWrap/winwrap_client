define(function () {
    var EditOp = {
        EditEditOp: 0,
        EnterEditOp: 1,
        FixupEditOp: 2,
        ProcEditOp: 3
    };

    ww.EditOp = EditOp;

    class Edit {
        constructor(op, index, deletecount, insert) {
            this.op_ = op;
            this.index_ = index;
            this.delete_count_ = deletecount;
            this.insert_ = insert;
        }

        AdjustCaret(x, is_server) {
            // server operation at Index does not adjust the caret
            if (x >= this.index_ + is_server) {
                if (x >= this.DeleteIndex())
                    x += this.Delta(); // shift by change's delta
                else if (is_server)
                    x = this.index_; // move to front of change
                else
                    x = this.InsertIndex(); // move to end of change
            }

            return x;
        }

        CanCombine(nextedit) {
            if (this.op_ !== ww.EditOp.EditEditOp || nextedit.op_ !== ww.EditOp.EditEditOp) {
                return this.op_ === nextedit.op_ && this.Equals(nextedit);
            }
            return this.index_ <= nextedit.DeleteIndex() && nextedit.index_ <= this.InsertIndex();
        }

        Combine(nextedit) {
            if (!this.CanCombine(nextedit))
                return false;

            let iIndex = 0;
            let iDelete = nextedit.delete_count_;
            let sInsert = '';
            let iThisInsertLength = this.InsertLength();

            // this is the prior edit
            let iPriorInsertHeadCount = 0;
            let iPriorInsertTailCount = 0;
            if (nextedit.index_ < this.index_) {
                // next edit is left of this (prior) edit
                iIndex = nextedit.index_;
                iPriorInsertHeadCount = 0;
                let iKeepDelete = this.index_ - iIndex;
                let iPriorInsertDelete = iDelete - iKeepDelete;
                if (iPriorInsertDelete > iThisInsertLength)
                    iPriorInsertDelete = iThisInsertLength;

                iDelete -= iPriorInsertDelete;
                iPriorInsertTailCount = iThisInsertLength - iPriorInsertDelete;
            }
            else {
                // next edit is at or right of this (prior) edit
                iIndex = this.index_;
                iPriorInsertHeadCount = nextedit.index_ - iIndex;
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
                sInsert += this.insert_.substring(0, iPriorInsertHeadCount);

            // all of next edit's insert
            sInsert += nextedit.insert_;

            // right portion of this (prior) edit's insert
            if (iPriorInsertTailCount > 0)
                sInsert += this.insert_.substring(iThisInsertLength - iPriorInsertTailCount);

            // all of this (prior) edit's delete count
            iDelete += this.delete_count_;

            this.index_ = iIndex;
            this.delete_count_ = iDelete;
            this.insert_ = sInsert;
            return true;
        }

        Copy() {
            return new Edit(this.op_, this.index_, this.delete_count_, this.insert_);
        }

        DeleteCount() {
            return this.delete_count_;
        }

        DeleteIndex() {
            return this.index_ + this.delete_count_;
        }

        Delta() {
            return this.InsertLength() - this.delete_count_;
        }

        Equals(edit) {
            return this.op_ === edit.op_ && this.index_ === edit.index_ && this.delete_count_ === edit.delete_count_ && this.insert_ === edit.insert_;
        }

        Index() {
            return this.index_;
        }

        Insert() {
            return this.insert_;
        }

        InsertIndex() {
            return this.index_ + this.InsertLength();
        }

        InsertLength() {
            return this.op_ === ww.EditOp.EditEditOp ? (this.insert_ === undefined ? 0 : this.insert_.length) : this.delete_count_;
        }

        IsNull() {
            return this.op_ === ww.EditOp.EditEditOp && this.delete_count_ === 0 && (this.insert_ === undefined || this.insert_ === '');
        }

        MergeTransform(serverEdit) {
            let beforeEdit = new Edit(0, 0, '');
            let afterEdit = new Edit(0, 0, '');
            if (this.DeleteIndex() < serverEdit.index_) {
                // entirely before serverEdit
                beforeEdit = this.Copy();
            }
            else if (this.index_ >= serverEdit.DeleteIndex()) {
                // entirely after serverEdit
                afterEdit = this.Copy();
                afterEdit.index_ += serverEdit.Delta();
            }
            else {
                // overlaps
                if (this.index_ < serverEdit.index_) {
                    // overlaps start - split into two
                    beforeEdit.index_ = this.index_;
                    beforeEdit.delete_count_ = serverEdit.index_ - this.index_;

                    afterEdit.index_ = serverEdit.insert_Index();
                    afterEdit.delete_count_ = this.delete_count_ - beforeEdit.delete_count_ - serverEdit.delete_count_;
                    if (afterEdit.delete_count_ < 0)
                        afterEdit.delete_count_ = 0;

                    // shift after edit forward
                    afterEdit.index_ -= beforeEdit.delete_count_;
                    if (afterEdit.index_ === beforeEdit.index_) {
                        // merge into after edit - remove before edit
                        afterEdit.delete_count_ += beforeEdit.delete_count_;
                        beforeEdit.delete_count_ = 0;
                    }
                }
                else {
                    // overlap end or subset
                    afterEdit.index_ = serverEdit.insert_Index();
                    afterEdit.delete_count_ = this.DeleteIndex() - serverEdit.DeleteIndex();
                    if (afterEdit.delete_count_ < 0)
                        afterEdit.delete_count_ = 0;
                    else if (afterEdit.delete_count_ > this.delete_count_)
                        afterEdit.delete_count_ = this.delete_count_;
                }

                afterEdit.insert_ = this.insert_;
            }

            let edits = [];
            if (!beforeEdit.IsNull())
                edits.push(beforeEdit);

            if (!afterEdit.IsNull())
                edits.push(afterEdit);

            return edits;
        }

        Op() {
            return this.op_;
        }

        RevertEdit(s0) {
            return new Edit(ww.EditOp.EditEditOp, this.index_, this.InsertLength(), s0.substring(this.index_, this.DeleteIndex()));
        }

        toString() {
            let s = this.index_ + '-' + this.delete_count_;
            if (this.insert_ !== undefined) {
                if (typeof this.insert_ === 'string') {
                    s += '"' + this.insert_ + '"'
                }
                else
                    s += JSON.stringify(this.insert_)
            }

            return s;
        }
    }

    ww.Edit = Edit;

    ww.Diff = (s0, s1, hint) => {
        let len0 = s0.length;
        let len1 = s1.length;
        if (len0 === len1 && s0 === s1)
            return null;

        let min = Math.min(len0, len1);
        let offset = 0;
        let guard = hint < 100 ? 5 : 50;
        if (hint >= guard && hint < min - guard) {
            let hint0 = len0 === min ? hint : hint + len0 - len1;
            let hint1 = len1 === min ? hint : hint + len1 - len0;
            if (s0.substring(0, hint - guard) === s1.substring(0, hint - guard) &&
                s0.substring(hint0 + guard) === s1.substring(hint1 + guard)) {
                // leading strings match from to hint - guard
                // trailing strings match from hint0 + guard and hint1 + guard
                offset = hint - guard;
                s0 = s0.substring(offset, hint0 + guard);
                s1 = s1.substring(offset, hint1 + guard);
            }
        }

        let index = 0;
        while (index < min) {
            if (s0.charAt(index) !== s1.charAt(index))
                break;
            ++index;
        }

        let i0 = len0;
        let i1 = len1;
        while (i0 > index && i1 > index) {
            if (s0.charAt(i0 - 1) !== s1.charAt(i1 - 1))
                break;
            --i0;
            --i1;
        }

        let deletecount = i0 - index;
        let insert = s1.substring(index, i1);
        return new Edit(ww.EditOp.EditEditOp, index + offset, deletecount, insert);
    };
});
