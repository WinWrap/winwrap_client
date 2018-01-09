var ww = ww || {};

/*
 * name interface elements in index.js
 *   by "interface.js" class object elsewhere
 *   but only one way ?
*/

require.config({ paths: { 'vs': 'scripts/monaco-editor/min/vs' } });
$(function () {
    require(['vs/editor/editor.main'], function () {

        console.log("winwrap_edit_client " + new Date().toString());

        monaco.languages.register({ id: 'vb' });
        ww.EditorImmediate = ww.MonacoEditor("immediateeditor", 150);
        ww.EditorWatch = ww.MonacoEditor("watcheditor", 125);
        let editorHeight = $(window).height() - $("#codeeditor").position().top - $("#version").height();
        ww.EditorCode = ww.MonacoEditor("codeeditor", editorHeight);
        ww.EditorCode.bindOnMouseDown();
        ww.Inteface = ww.InterfaceJS(); // bind interface elements only when document ready

        let serverip = getSearchParams("serverip");
        let apiurl = `http://${serverip}/winwrap/`;
        //console.log({ apiurl: apiurl });
        ww.Attach = new ww.AttachPrototype(apiurl);
        ww.Ajax = new ww.AjaxPrototype(); // ({ enablepolling: false }); // () for default

        var text = $("#buttonui").text();
        $("#buttonui").text("loading");
        attachServerAsync().then(data => {
            ww.Interface.Initialize();
            ww.AutoComplete.Register();
            ww.SignatureHelp.Register();
            $("#buttonui").text(text);
            ww.Test = new ww.TestPrototype(ww.EditorCode);
            ww.Ajax.StartPolling();
            ww.Notifications.NeedState();
        }); // now UI is initialized
    });

    async function attachServerAsync() {
        //var name = arguments.callee.name; // removed in ES5 strict mode
        //console.log(name);
        let result = await ww.Attach.ExecuteAsync().catch(err => {
            console.log("index.js Attach.ExecuteAsync ", err);
        });
        result = await ww.ButtonNew.ExecuteAsync().catch(err => {
            console.log("index.js ButtonNew.ExecuteAsync ", err);
        });
        result = await ww.InputMacro.OpenDialogAsync().catch(err => {
            console.log("index.js InputMacro.OpenDialogAsync ", err);
        });
        return result;
    }

    function getSearchParams(k) {
        var p = {};
        location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (s, k, v) { p[k] = v; });
        return k ? p[k] : p;
    }
});
