define(function () {

    class AutoComplete {
        constructor(basic) {
            this.Basic = basic;
            this.autoTypes_ = autotypes;
            this.re_auto = new RegExp([
                /\s/,       // space, or /Imports\s|As\s|Of\s/ etc.
                /^\'#/,     // '#
                /\./        // member
            ].map(r => r.source).join('|'));
            // ? = CallersLine (global)
        }
        Register() {
            let basic = this.Basic; // can't pass this through closure to the lambdas below
            monaco.languages.registerCompletionItemProvider('vb', {
                triggerCharacters: [' ', '.', '#', '=', ',', '\t', '\xA0'], // '(', ')'
                provideCompletionItems: async function (model, position) {
                    let textUntilPosition = basic.EditorCode.textUntilPosition(model, position);
                    let match = textUntilPosition.match(this.re_auto); // limits traffic to server
                    if (match) {
                        await basic.AutoAuto.SendAsync(model, position);
                        return basic.AutoComplete.createDependencyProposals(); // incomplete not used
                    }
                }
            });
        }
        createDependencyProposals() {
            let deps = [];
            let response = this.Basic.AutoAuto.Response;
            if (response != null && response.members !== undefined) {
                let autoComplete = response.members;
                for (let key in autoComplete) {
                    let itemKind = this.autoTypes_[autoComplete[key]];
                    let dep = {
                        label: key,
                        kind: monaco.languages.CompletionItemKind[itemKind],
                        insertText: key
                    };
                    deps.push(dep);
                }
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

    ww.AutoComplete = AutoComplete;

});
