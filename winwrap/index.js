var ww = ww || {};

/*
 * name interface elements in index.js
 *   by "interface.js" class object elsewhere
 *   but only one way ?
*/

require.config({ paths: { 'vs': 'scripts/monaco-editor/min/vs' } });
$(function () {
    require(['vs/editor/editor.main', 'winwrap/basic'], require => {

        console.log("winwrap_edit_client " + new Date().toString());

        monaco.languages.register({ id: 'vb' });

        let serverip = getSearchParams("serverip");
        ww.Basics.Initialize(serverip);
    });

    function getSearchParams(k) {
        var p = {};
        location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (s, k, v) { p[k] = v; });
        return k ? p[k] : p;
    }
});
