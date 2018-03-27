//FILE: signaturehelp.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class SignatureHelp {

        constructor(autoauto) {
            let this_ = this; // can't pass this through closure to the lambdas below
            monaco.languages.registerSignatureHelpProvider('vb', {
                // 1/15/18 - Tom
                // added ' ': WinWrap Basic doesn't require () around parameters
                signatureHelpTriggerCharacters: ['(',' ',','],
                provideSignatureHelp: async function (model, position) {
                    let textUntilPosition = autoauto.TextUntilPosition(model, position);
                    // 1/15/18 - Tom
                    // added ' '
                    // 1/18/18 - Ed
                    // keep signature displayed until closed
                    //let match = textUntilPosition.match(/[( ][^)]*$/);
                    let match = true;
                    if (match) { // was [{}]
                        let response = await autoauto.SendAndReceiveAsync(model, position);
                        return this_._CreateSignatureHelp(response);
                    }
                    return undefined;
                }
            });
        }

        _CreateSignatureHelp(response) {
            //console.log("_createSignatureHelp");
            if (response === null) {
                console.log("ww-error: _createSignatureHelp no response"); // xxx
                //return {};
            }
            if (response === null || !('prototypes' in response)) {
                return undefined;
            }
            //console.log(response);
            let result = {
                signatures: response.prototypes.map(prototype => {
                    return {
                        label: prototype.text,
                        parameters: prototype.params.map(item => {
                            let parameter = prototype.text.substring(item[0], item[0] + item[1]);
                            return { label: parameter };
                        })
                    };
                }),
                activeSignature: response.prototype_index,
                activeParameter: response.prototype_arg_index
            };
            return result;
        }
    }

    ww.SignatureHelp = SignatureHelp;

});