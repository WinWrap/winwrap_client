//FILE: signaturehelp.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2020 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class SignatureHelp {

        constructor(autoauto) {
            monaco.languages.registerSignatureHelpProvider('vb', {
                // 1/15/18 - Tom
                // added ' ': WinWrap Basic doesn't require () around parameters
                signatureHelpTriggerCharacters: ['(',' ',','],
                provideSignatureHelp: async (model, position) => {
                    let textUntilPosition = autoauto.TextUntilPosition(model, position);
                    //let match = textUntilPosition.match(/[( ][^)]*$/);
                    let match = true;
                    if (match) {
                        let response = await autoauto.SendAndReceiveAsync(model, position);
                        return this._CreateSignatureHelp(response);
                    }
                    return undefined;
                }
            });
        }

        _CreateSignatureHelp(response) {
            if (response === null) {
                console.log("ww-error: _createSignatureHelp no response");
            }
            if (response === null || !('prototypes' in response)) {
                return undefined;
            }
            let result = {
                signatures: response.prototypes.map(prototype => {
                    return {
                        label: prototype.text,
                        parameters: this._CreateParameters(prototype)
                    };
                }),
                activeSignature: response.prototype_index,
                activeParameter: response.prototype_arg_index
            };
            return result;
        }

        _CreateParameters(prototype) {
            let result = (typeof prototype.params === 'undefined')
                ? []
                : prototype.params.map(item => {
                let parameter = prototype.text.substring(item[0], item[0] + item[1]);
                return { label: parameter };
            });
            return result;
        }
    }

    ww.SignatureHelp = SignatureHelp;

});