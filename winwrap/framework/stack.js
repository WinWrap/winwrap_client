//FILE: stack.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class Stack {
        constructor(channel) {
            this.channel_ = channel;
            this.breaks = [];
        }
        GetPauseLine(name) {
            let line = null;
            if (this.stack.length > 0) {
                let stack0 = this.stack[0];
                if (stack0.name === name) {
                    line = stack0.linenum;
                }
            }
            return line;
        }
        StateResponseHandler(response) {
            if (response.response !== '!state') {
                if (response.stack !== undefined) {
                    this.stack = response.stack;
                } else {
                    this.stack = [];
                }
            }
        }
    }

    ww.Stack = Stack;

});
