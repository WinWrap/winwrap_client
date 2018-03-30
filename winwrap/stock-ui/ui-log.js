//FILE: ui-items.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(['./renderjson'], function () {

    class Log {
        constructor(ui, channel, element) {
            this.element_ = element;
            renderjson.set_show_to_level(1);
            let this_ = this; // closure can't handle this in the lambdas below
            channel.SetLogger((label, data) => {
                element.append(renderjson(data));
            });
        }
    }

    ww.Log = Log;

});
