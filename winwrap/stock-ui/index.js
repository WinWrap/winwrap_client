var ww = ww || {};

require.config({ paths: { 'vs': 'scripts/monaco-editor/min/vs' } });
$(function () {
    require(['vs/editor/editor.main',
        'winwrap/framework/basic',
        'winwrap/monaco-editor/monacoeditor',
        'winwrap/stock-ui/ui-items',
        'winwrap/stock-transport/transport'], require => {

        console.log('winwrap_change_client ' + new Date().toString());

        monaco.languages.register({ id: 'vb' });

        let serverip = getSearchParams('serverip');
        let transport = new ww.Transport(serverip);
        let factory = {
            'ww-remote': (basic, name) => { return new ww.Remote(basic, name, transport); },
            'ww-channel': (remote, name) => { return new ww.Channel(remote, name); },
            'ww-ui': (channel, name) => { return new ww.UI(channel, name); },
            'ww-item': (ui, element, name) => { return ww.CreateItem(ui, element, name); }
        };

        let basic = new ww.Basic();
        basic.Initialize(factory);
    });

    function getSearchParams(k) {
        let p = {};
        location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (s, k, v) { p[k] = v; });
        return k ? p[k] : p;
    }
});
