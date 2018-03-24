//FILE: commit.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(function () {
    class Commit {
        constructor() {
            this.changes_ = new ww.Changes();
            this.revert_changes_ = new ww.Changes();
        }

        AnyChanges() {
            return this.changes_.AnyChanges();
        }

        AppendChange(nextchange) {
            this.changes_.Append(nextchange);
        }

        Changes() {
            return this.changes_;
        }

        PrependRevertChange(priorchange) {
            this.revert_changes_.Prepend(priorchange);
        }

        RevertChanges() {
            return this.revert_changes_;
        }
            
        TakeChanges(need_commit) {
            let commit = null;
            if (this.AnyChanges() || need_commit) {
                commit = new Commit();
                commit.changes_ = this.changes_;
                this.changes_ = new ww.Changes();
                commit.revert_changes_ = this.revert_changes_;
                this.revert_changes_ = new ww.Changes();
            }

            return commit;
        }

        Log(title) {
            //console.log(title);
            //console.log(this);
        }
    }

    ww.Commit = Commit;
});
