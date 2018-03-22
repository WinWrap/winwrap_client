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
        constructor(decorate) {
            this.Decorate = decorate;
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
        SetBreak(notification) {
            let breaks = this.breaks;
            breaks = breaks.filter(el => el.line !== notification.line || el.target !== notification.target);
            if (notification.on === true) {
                breaks.push({ 'target': notification.target, 'line': notification.line });
            }
            this.breaks = breaks;
            this.Decorate.Display();
        }
        SetBreaks(notification) {
            let breaks = [];
            let newBreaks = notification.breaks;
            if (newBreaks !== undefined) {
                newBreaks.forEach(macroBreaks => {
                    macroBreaks.lines.forEach(line => {
                        breaks.push({ 'target': macroBreaks.name, 'line': line });
                    });
                });
            }
            this.breaks = breaks;
            this.Decorate.Display();
        }
    }

    ww.Breaks = Breaks;

});
