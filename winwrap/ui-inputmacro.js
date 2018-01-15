define(function () {

    class InputMacro {
        constructor() {
            this.macros_ = []; // xxx Macros
        }
        GetValue() {
            return $("#inputmacro").val();
        }
        SetValue(value) {
            $("#inputmacro").val(value);
        }
        SetValues(values) {
            this.macros_ = values;
            if (values.find(item => item === "\\Sample1.bas")) {
                ww.Ajax.PushPendingRequest({ command: "?read", target: "\\Sample1.bas" });
            }
            else {
                ww.Ajax.PushPendingRequest({ command: "?new", names: [] });
            }
        }
        Initialize() {
            $("#inputmacro").autocomplete({
                source: function (request, response) {
                    let term = $.ui.autocomplete.escapeRegex(request.term);
                    //console.log(term);
                    var matcher = new RegExp(`^.*${term}.*$`, "i");
                    response($.grep(ww.InputMacro.macros_, function (item) { // xxx
                        return matcher.test(item);
                    }));
                }
            });
            $("#inputmacro").on("autocompleteselect", function (event, ui) {
                ww.Ajax.PushPendingRequest({ command: "?read", target: ui.item.value });
            });
        }
    }

    ww.InputMacro = new InputMacro();

});
