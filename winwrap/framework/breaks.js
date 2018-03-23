//FILE: breaks.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class Breaks {
        constructor(channel) {
            this.channel_ = channel;
            this.breaks = [];
        }
        GetBreaks(target) {
            let breaks = this.breaks;
            breaks = breaks.filter(el => el.target === target);
            return breaks;
        }
        IsBreak(name, aline) {
            let breaks = this.breaks;
            let abreak = breaks.find(el => {
                let match = el.target === name && el.line === aline;
                return match;
            });
            return abreak !== undefined;
        }
        BreakResponseHandler(response) {
            let breaks = this.breaks;
            breaks = breaks.filter(el => el.line !== response.line || el.target !== response.target);
            if (response.on === true) {
                breaks.push({ 'target': response.target, 'line': response.line });
            }
            this.breaks = breaks;
        }
        BreaksResponseHandler(response) {
            let breaks = [];
            let newBreaks = response.breaks;
            if (newBreaks !== undefined) {
                newBreaks.forEach(macroBreaks => {
                    macroBreaks.lines.forEach(line => {
                        breaks.push({ 'target': macroBreaks.name, 'line': line });
                    });
                });
            }
            this.breaks = breaks;
        }
    }

    ww.Breaks = Breaks;

});
