//FILE: autocomplete.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2020 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class AutoComplete {

        constructor(autoauto) {
            this.autoTypes_ = autotypes;
            monaco.languages.registerCompletionItemProvider('vb', {
                triggerCharacters: triggerCharacters,
                provideCompletionItems: async (model, position) => {
                    let textUntilPosition = autoauto.TextUntilPosition(model, position);
                    let temp = textUntilPosition.replace(/[ \t\xA0]/, '');
                    if (temp !== '') {
                        let ch = textUntilPosition.substr(-1);
                        let index = triggerCharacters.indexOf(ch);
                        if (index !== -1) {
                            let response = await autoauto.SendAndReceiveAsync(model, position);
                            return this._CreateDependencyProposals(response); // incomplete not used
                        }
                    }
                }
            });
        }

        _CreateDependencyProposals(response) {
            //console.log("_createDependencyProposals");
            let suggestions = [];
            if (response === null) {
                console.log("ww-error: _createDependencyProposals no response"); // xxx
                return;
            }
            if (!('members' in response)) {
                return;
            }
            let autoComplete = response.members;
            for (let key in autoComplete) {
                let itemKind = this.autoTypes_[autoComplete[key]];
                let suggestion = {
                    label: key,
                    kind: monaco.languages.CompletionItemKind[itemKind],
                    insertText: key
                };
                suggestions.push(suggestion);
            }
            return { isIncomplete: false, suggestions: suggestions };
        }
    }

    let triggerCharacters = [' ', '.', '#', '=', ',', '\t', '\xA0'];

    // no vaiables in class
    let autotypes = [ // xxx match documentation, MonacoTypes or such
        'Method', // MC_METHOD
        'Property', // MC_PROPERTY
        'Property', // MC_DEFAULTPROPERTY
        'Reference', // MC_EVENT
        'Value', // MC_CONSTANT
        'Enum', // MC_ENUM
        'Unit', // MC_BUILTINTYPE
        'Class', // MC_CLASS
        'Module', // MC_MODULE
        'Color', // MC_RECORD
        'Interface', // MC_INTERFACE
        'Function', // MC_DELEGATE
        'Color', // MC_PREDECLAREDID
        'Color', // MC_LIBRARY
        'Reference', // MC_NAMESPACE
        'Snippet', // MC_SPECIAL
        'Color', // MC_CERTKEY
        'Color'  // MC_EXTEND
    ];

    ww.AutoComplete = AutoComplete;

});
