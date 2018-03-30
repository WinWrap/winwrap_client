//FILE: ui-items.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class Log {
        constructor(ui, channel, element) {
            this.element_ = element;
            let list = $('<ul/>');
            list.appendTo(element);
            let this_ = this; // closure can't handle this in the lambdas below
            channel.SetLogger((label, data) => {
                let html = this_._Html(label, data);
                html.appendTo(list);
            });
        }

        _Html(label, data) {
            let item = $('<li/>');
            if (Array.isArray(data)) {
                item.text(label);
                let list = $('<ul/>');
                let i = 0;
                data.forEach(value => {
                    this._Html(`[${i}] `, value).appendTo(list);
                    ++i;
                });
                list.appendTo(item);
            }
            else if (typeof data === 'object') {
                item.text(label);
                let list = $('<ul/>');
                Object.keys(data).forEach(key => {
                    let value = data[key];
                    this._Html(key, value).appendTo(list);
                });
                list.appendTo(item);
            }
            else
                item.text(label +': ' + JSON.stringify(data));
            return item;
        }
    }

    ww.Log = Log;

});
