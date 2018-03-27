//FILE: monacoshared.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class MonacoShared { // singleton

        constructor() {
            this.models_ = [];
        }

        GetEditor(model) {
            return this.models_[model.id];
        }

        Initialize() {
            monaco.languages.register({ id: 'vb' });
            this.autoauto_ = new ww.AutoAuto();
        }

        RegisterModel(model, editor) {
            this.models_[model.id] = editor;
        }
    }

    ww.MonacoShared = new MonacoShared();

});