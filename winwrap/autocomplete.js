var ww = ww || {};

(function () {

    class AutoComplete {
        constructor() {
            this.autoTypes_ = autotypes;
            //xlet match = textUntilPosition.match(/As\s\w+|\w\.\w+|\=\s\w+$/); // = CallersLine (global)
            //xlet match = textUntilPosition.match(/(\s|Imports\s|As\s|^\'#|\.)$/); // Of\s
            //this.re_auto = new RegExp(/(\s|^\'#|\.)$/); // Of\s
            this.re_auto = new RegExp([
                /\s/        // space
                , /^\'#/     // '#
                , /\./       // member
            ].map(r => r.source).join('|'));
            /*let s = [
                /\s/        // space
                , /^\'#/     // '#
                , /\./       // member
            ].map(r => r.source).join('|');
            this.re_auto = new RegExp(s);*/
        }
        Register() {
            monaco.languages.registerCompletionItemProvider('vb', {
                triggerCharacters: [' ', '.', '#', '=', ',', '\t', '\xA0'], // '(', ')'
                provideCompletionItems: async function (model, position) {
                    let textUntilPosition = ww.EditorCode.textUntilPosition(model, position);
                    let match = textUntilPosition.match(this.re_auto); // limits traffic to server
                    if (match) {
                        await ww.AutoAuto.SendAsync(model, position);
                        return ww.AutoComplete.createDependencyProposals(ww.AutoAuto.Response.members); // incomplete not used
                    }
                }
            });
        }
        createDependencyProposals(autoComplete) {
            let deps = [];
            for (let key in autoComplete) {
                let itemKind = this.autoTypes_[autoComplete[key]];
                let dep = {
                    label: key,
                    kind: monaco.languages.CompletionItemKind[itemKind],
                    insertText: key
                };
                deps.push(dep);
            }
            return { isIncomplete: false, items: deps };
        }
    }

    // no vaiables in class
    let autotypes = [ // xxx match documentation, MonacoTypes or such
        "Method", // MC_METHOD
        "Property", // MC_PROPERTY
        "Property", // MC_DEFAULTPROPERTY
        "Reference", // MC_EVENT
        "Value", // MC_CONSTANT
        "Enum", // MC_ENUM
        "Unit", // MC_BUILTINTYPE
        "Class", // MC_CLASS
        "Module", // MC_MODULE
        "Color", // MC_RECORD
        "Interface", // MC_INTERFACE
        "Function", // MC_DELEGATE
        "Color", // MC_PREDECLAREDID
        "Color", // MC_LIBRARY
        "Reference", // MC_NAMESPACE
        "Snippet", // MC_SPECIAL
        "Color", // MC_CERTKEY
        "Color"  // MC_EXTEND
    ];

    ww.AutoComplete = new AutoComplete();

})();
