define(function () {

    class SignatureHelp {
        constructor(autoauto) {
            let signatureHelp = this; // can't pass this through closure to the lambdas below
            monaco.languages.registerSignatureHelpProvider('vb', {
                signatureHelpTriggerCharacters: ['(',' '],
                provideSignatureHelp: async function (model, position) {
                    let textUntilPosition = autoauto.Element.textUntilPosition(model, position);
                    let match = textUntilPosition.match('[(]'); // was '('
                    if (match) { // was [{}]
                        let response = await autoauto.SendAsync(model, position);
                        return signatureHelp._createSignatureHelp(response);
                    }
                    return {};
                }
            });
        }
        _createSignatureHelp(response) {
            if (!('prototypes' in response)) {
                throw "ww-error: createSignatureHelp(response) no prototypes in response"; // xxx
                //return {};
            }
            let result = {
                signatures: response.prototypes.map(prototype => {
                    return {
                        label: prototype.text,
                        parameters: prototype.params.map(item => {
                            let parameter = prototype.text.substring(item[0], item[0] + item[1] + 1);
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