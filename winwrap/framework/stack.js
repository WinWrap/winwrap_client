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
        constructor(decorate) {
            this.Decorate = decorate;
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
        SetStack(notification) {
            if (notification.response !== '!state') {
                if (notification.stack !== undefined) {
                    this.stack = notification.stack;
                } else {
                    this.stack = [];
                }
                this.Decorate.Display();
            }
        }
    }

    ww.Stack = Stack;

});
