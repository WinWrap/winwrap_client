//FILE: change.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(function () {
    var ChangeOp = {
        EditChangeOp: 0,
        EnterChangeOp: 1,
        FixupChangeOp: 2,
        ProcChangeOp: 3
    };

    ww.ChangeOp = ChangeOp;

    class Change {
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

        CanCombine(nextchange) {
            if (this.op_ !== ww.ChangeOp.EditChangeOp || nextchange.op_ !== ww.ChangeOp.EditChangeOp) {
                return this.op_ === nextchange.op_ && this.Equals(nextchange);
            }
            return this.index_ <= nextchange.DeleteIndex() && nextchange.index_ <= this.InsertIndex();
        }

        Combine(nextchange) {
            if (!this.CanCombine(nextchange))
                return false;

            let iIndex = 0;
            let iDelete = nextchange.delete_count_;
            let sInsert = '';
            let iThisInsertLength = this.InsertLength();

            // this is the prior change
            let iPriorInsertHeadCount = 0;
            let iPriorInsertTailCount = 0;
            if (nextchange.index_ < this.index_) {
                // next change is left of this (prior) change
                iIndex = nextchange.index_;
                iPriorInsertHeadCount = 0;
                let iKeepDelete = this.index_ - iIndex;
                let iPriorInsertDelete = iDelete - iKeepDelete;
                if (iPriorInsertDelete > iThisInsertLength)
                    iPriorInsertDelete = iThisInsertLength;

                iDelete -= iPriorInsertDelete;
                iPriorInsertTailCount = iThisInsertLength - iPriorInsertDelete;
            }
            else {
                // next change is at or right of this (prior) change
                iIndex = this.index_;
                iPriorInsertHeadCount = nextchange.index_ - iIndex;
                if (iPriorInsertHeadCount > iThisInsertLength)
                    iPriorInsertHeadCount = iThisInsertLength;

                iPriorInsertTailCount = iThisInsertLength - iPriorInsertHeadCount;
                if (iDelete < iPriorInsertTailCount) {
                    // all of next change's delete count goes to the this (prior) change's insert
                    // some of the this (prior) change's insert is still inserted (tail portion)
                    iPriorInsertTailCount -= iDelete;
                    iDelete = 0;
                }
                else {
                    // some of the next change's delete goes to the constructed change
                    // none of the this (prior) change's insert beyond the head portion is retained
                    iDelete -= iPriorInsertTailCount;
                    iPriorInsertTailCount = 0;
                }
            }

            // left portion of this (prior) change's insert
            if (iPriorInsertHeadCount > 0)
                sInsert += this.insert_.substring(0, iPriorInsertHeadCount);

            // all of next change's insert
            sInsert += nextchange.insert_;

            // right portion of this (prior) change's insert
            if (iPriorInsertTailCount > 0)
                sInsert += this.insert_.substring(iThisInsertLength - iPriorInsertTailCount);

            // all of this (prior) change's delete count
            iDelete += this.delete_count_;

            this.index_ = iIndex;
            this.delete_count_ = iDelete;
            this.insert_ = sInsert;
            return true;
        }

        Copy() {
            return new Change(this.op_, this.index_, this.delete_count_, this.insert_);
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

        Equals(change) {
            return this.op_ === change.op_ && this.index_ === change.index_ && this.delete_count_ === change.delete_count_ && this.insert_ === change.insert_;
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
            return this.op_ === ww.ChangeOp.EditChangeOp ? (this.insert_ === undefined ? 0 : this.insert_.length) : this.delete_count_;
        }

        IsNull() {
            return this.op_ === ww.ChangeOp.EditChangeOp && this.delete_count_ === 0 && (this.insert_ === undefined || this.insert_ === '');
        }

        MergeTransform(serverChange) {
            let beforeChange = new Change(0, 0, '');
            let afterChange = new Change(0, 0, '');
            if (this.DeleteIndex() < serverChange.index_) {
                // entirely before serverChange
                beforeChange = this.Copy();
            }
            else if (this.index_ >= serverChange.DeleteIndex()) {
                // entirely after serverChange
                afterChange = this.Copy();
                afterChange.index_ += serverChange.Delta();
            }
            else {
                // overlaps
                if (this.index_ < serverChange.index_) {
                    // overlaps start - split into two
                    beforeChange.index_ = this.index_;
                    beforeChange.delete_count_ = serverChange.index_ - this.index_;

                    afterChange.index_ = serverChange.insert_Index();
                    afterChange.delete_count_ = this.delete_count_ - beforeChange.delete_count_ - serverChange.delete_count_;
                    if (afterChange.delete_count_ < 0)
                        afterChange.delete_count_ = 0;

                    // shift after change forward
                    afterChange.index_ -= beforeChange.delete_count_;
                    if (afterChange.index_ === beforeChange.index_) {
                        // merge into after change - remove before change
                        afterChange.delete_count_ += beforeChange.delete_count_;
                        beforeChange.delete_count_ = 0;
                    }
                }
                else {
                    // overlap end or subset
                    afterChange.index_ = serverChange.insert_Index();
                    afterChange.delete_count_ = this.DeleteIndex() - serverChange.DeleteIndex();
                    if (afterChange.delete_count_ < 0)
                        afterChange.delete_count_ = 0;
                    else if (afterChange.delete_count_ > this.delete_count_)
                        afterChange.delete_count_ = this.delete_count_;
                }

                afterChange.insert_ = this.insert_;
            }

            let changes = [];
            if (!beforeChange.IsNull())
                changes.push(beforeChange);

            if (!afterChange.IsNull())
                changes.push(afterChange);

            return changes;
        }

        Op() {
            return this.op_;
        }

        RevertChange(s0) {
            return new Change(ww.ChangeOp.EditChangeOp, this.index_, this.InsertLength(), s0.substring(this.index_, this.DeleteIndex()));
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

    ww.Change = Change;

    ww.Diff = (s0, s1, hint) => {
        let len0 = s0.length;
        let len1 = s1.length;
        let delta = len1 - len0;
        if (delta === 0 && s0 === s1)
            return null;

        if (delta > 0 && hint >= delta && hint <= len1) {
            // detect simple insertion before hint (caret)
            let left = hint - delta;
            if (s0.substring(0, left) === s1.substring(0, left) &&
                s0.substring(left) === s1.substring(hint)) {
                let insert = s1.substring(left, hint);
                return new ww.Change(ww.ChangeOp.EditChangeOp, left, 0, insert);
            }
        }
        else if (delta < 0 && hint >= 0 && hint <= len0) {
            // detect simple deletion after hint (caret)
            let right = hint - delta; // delta is negative
            if (s0.substring(0, hint) == s1.substring(0, hint) &&
                s0.substring(right) == s1.substring(hint)) {
                let deletecount = -delta;
                return new ww.Change(ww.ChangeOp.EditChangeOp, hint, deletecount, '');
            }
        }

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
        return new Change(ww.ChangeOp.EditChangeOp, index + offset, deletecount, insert);
    };

    class Changes {
        constructor(changes = []) {
            this.changes_ = [...changes];
        }

        AnyChanges() {
            return this.changes_.length !== 0;
        }

        Append(nextchange) {
            if (Array.isArray(nextchange)) // ??? is an object
                nextchange.forEach(change => { this.Append(change); });
            else if (this.changes_.length === 0 || !this.changes_[this.changes_.length - 1].Combine(nextchange))
                // don't overlap (successfully combined)
                this.changes_.push(nextchange);
        }

        AppendNoCombine(nextchange) {
            if (Array.isArray(nextchange))
                this.changes_ = this.changes_.concat(nextchange);
            else
                this.changes_.push(nextchange);
        }

        Changes() {
            return this.changes_;
        }

        Equals(changes) {
            if (this.changes_.length !== changes.changes_.length)
                return false;

            for (var i = 0; i < this.changes_.length; ++i)
                if (!this.changes_[i].Equals(changes.changes_[i]))
                    return false;

            return true;
        }

        MergeTransform(serverChanges) {
            let mergedChanges = new Changes(this.changes_);
            // apply server Commit to create new Changes
            serverChanges.Changes().forEach(function (serverChange) {
                // apply each server Change to create a new merged changes
                let transformedChanges = new Changes();
                mergedChanges.Changes().forEach(change => {
                    transformedChanges.AppendNoCombine(change.MergeTransform(serverChange));
                });

                mergedChanges = transformedChanges;
            });
            return mergedChanges;
        }

        Prepend(priorchange) {
            if (Array.isArray(priorchange)) // ??? is an object
                priorchange.forEach(change => { this.Prepend(change); });
            else if (this.changes_.length === 0)
                this.changes_.unshift(priorchange);
            else {
                let change = priorchange.Copy();
                if (!change.Combine(this.changes_[0]))
                    this.changes_.unshift(priorchange);
                else
                    this.changes_[0] = change;
            }
        }
    }

    ww.Changes = Changes;

});
