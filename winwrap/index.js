var ww = ww || {};

/*
 * name interface elements in index.js
 *   by "interface.js" class object elsewhere
 *   but only one way ?
*/

require.config({ paths: { 'vs': 'scripts/monaco-editor/min/vs', 'ww': 'winwrap' } });
$(function () {
    require(['vs/editor/editor.main', 'ww/basic'], require => {

        console.log("winwrap_edit_client " + new Date().toString());

        monaco.languages.register({ id: 'vb' });
        ww.EditorImmediate = ww.MonacoEditor("immediateeditor", 150);
        ww.EditorWatch = ww.MonacoEditor("watcheditor", 125);
        let editorHeight = $(window).height() - $("#codeeditor").position().top - $("#version").height();
        ww.EditorCode = ww.MonacoEditor("codeeditor", editorHeight);
        ww.EditorCode.bindOnMouseDown();
        ww.Interface = new ww.InterfacePrototype(); // bind interface elements only when document ready

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
            ww.Ajax.PushPendingRequest({ command: "?opendialog", dir: "\\", exts: "wwd|bas" });
            ww.Ajax.PushPendingRequest({ command: "?stack" });
        }); // now UI is initialized
    });

    async function attachServerAsync() {
        //var name = arguments.callee.name; // removed in ES5 strict mode
        //console.log(name);
        return await ww.Attach.ExecuteAsync().catch(err => {
            console.log("ERROR index.js Attach.ExecuteAsync ", err);
        });
    }

    function getSearchParams(k) {
        var p = {};
        location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (s, k, v) { p[k] = v; });
        return k ? p[k] : p;
    }
});
