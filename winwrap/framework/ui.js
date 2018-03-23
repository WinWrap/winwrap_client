//FILE: ui.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class UI {
        constructor(channel, name) {
            this.Channel = channel;
            this.Name = name;
            this.items_ = {};
        }
        AddItem(item, name) {
            if (item !== undefined) {
                this.items_[name] = item;
            }
        }
        GetItem(name) {
            return this.items_[name];
        }
    }

    ww.UI = UI;

});
