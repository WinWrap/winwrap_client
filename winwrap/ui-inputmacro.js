var ww = ww || {};

(function () {

    class InputMacro {
        constructor() {
            this.macros_ = []; // xxx Macros
            this.Name = "";
        }
        GetValue() {
            return $("#inputmacro").val();
        }
        UpdateMacroListRequest() {
            let request = {
                command: "?opendialog", dir: "",
                //root_dir: "C:\\Users\\edwbe\\Documents\\WinWrapThread", exts: "bas|xml" // xxx
                //root_dir: "C:\\Users\\Public\\Documents\\WinWrapThread", exts: "bas|xml" // xxx
                //root_dir: "C:\\Users\\winwrap\\Documents\\WinWrapThread", exts: "bas|xml" // xxx
                root_dir: "\\WinWrapThread", exts: "bas|xml" // xxx
            };
            return request;
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
                ww.InputMacro.Read(ui.item.value);
            });
        }
        Read(name) { // xxx ?
            let requests = this.ReadRequests(name);
            let result = ww.Ajax.SendProcess(requests);
            return result;
        }
        ReadRequests(name) { // xxx needed ?
            if (name !== undefined) {
                $("#inputmacro").val(name);
                this.Name = name;
            }
            return [
                { command: "?read", target: this.GetValue() },
                { command: "?breaks", target: this.GetValue() }
            ];
        }
        async ReadAsync(name) {
            let requests = this.ReadRequests(name);
            let result = await new ww.AjaxPost().Send(requests);
            return result;
        }
        async OpenDialogAsync() {
            let request = {
                command: "?opendialog", dir: "", root_dir: "", exts: "bas|"
            };
            let result = await new ww.AjaxPost().SendAsync(request, ["!opendialog"]).catch(err => {
                console.log("ui-inputmacro.js OpenDialogAsync ", err);
            });
            let opendialogresponse = result.find(o => o.response === "!opendialog");
            this.macros_ = opendialogresponse.names.map(item => item.name);
            return result;
        }
    }

    ww.InputMacro = new InputMacro();

})();
