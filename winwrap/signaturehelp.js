define(function () {

    class SignatureHelp {
        constructor(autoauto) {
            let signatureHelp = this; // can't pass this through closure to the lambdas below
            monaco.languages.registerSignatureHelpProvider('vb', {
                // 1/15/18 - Tom
                // added ' ': WinWrap Basic doesn't require () around parameters
                signatureHelpTriggerCharacters: ['(',' ',','],
                provideSignatureHelp: async function (model, position) {
                    let textUntilPosition = autoauto.Editor.textUntilPosition(model, position);
                    // 1/15/18 - Tom
                    // added ' '
                    //let match = textUntilPosition.match(/[( ,]$/);
                    let match = textUntilPosition.match(/\([^)]*$/);
                    if (match) { // was [{}]
                        let response = await autoauto.SendAsync(model, position);
                        return signatureHelp._createSignatureHelp(response);
                    }
                    return undefined;
                }
            });
        }
        _createSignatureHelp(response) {
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
            //ww.Browser.Log(result);
            return result;
        }
    }

    ww.SignatureHelp = SignatureHelp;

});