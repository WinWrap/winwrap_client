define(function () {

    class SignatureHelp {
        constructor(basic) {
            this.Basic = basic;
        }
        createSignatureHelp(response) {
            if (!("prototypes" in response)) {
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
        Register() {
            let basic = this.Basic; // can't pass this through closure to the lambdas below
            monaco.languages.registerSignatureHelpProvider('vb', {
                signatureHelpTriggerCharacters: ['('],
                provideSignatureHelp: async function (model, position) {
                    let textUntilPosition = basic.EditorCode.textUntilPosition(model, position);
                    let match = textUntilPosition.match("[(]"); // was "("
                    if (match) { // was [{}]
                        await basic.AutoAuto.SendAsync(model, position);
                        return basic.SignatureHelp.createSignatureHelp(basic.AutoAuto.Response);
                    }
                    return {};
                }
            });
        }
    }

    ww.SignatureHelp = SignatureHelp;

    /*let aprototypes = {
        signatures: [{
            label: "MsgBox(ByVal Message As String, Optional ByVal Type As VbMsgBoxStyle, Optional ByVal Title As String) As VbMsgBoxResult",
            //documentation: " this method does blah",
            parameters: [
                {
                    label: "ByVal Message As String"
                    //documentation: "this param does blah"
                },
                {
                    label: "Optional ByVal Type As VbMsgBoxStyle"
                    //documentation: "this param does blah"
                },
                {
                    label: "Optional ByVal Title As String"
                    //documentation: "this param does blah"
                }
            ]
        }],
        activeSignature: 0,
        activeParameter: 0
    };*/

});