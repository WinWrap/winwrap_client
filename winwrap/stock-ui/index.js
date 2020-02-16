//FILE: index.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2020 Polar Engineering, Inc.
// All rights reserved.

var ww = ww || {};

require.config({ paths: { 'vs': 'scripts/monaco-editor/min/vs' } });
$(function () {
    require(['vs/editor/editor.main',
        'winwrap/framework/all',
        'winwrap/monaco-editor/all',
        'winwrap/stock-ui/all',
        'winwrap/stock-transport/all'], require => {

        console.log('winwrap_change_client ' + new Date().toString());

        ww.MonacoShared.Initialize();

        let serverip = getSearchParams('serverip');
        let transport = new ww.Transport(serverip);
        let factory = {
            'ww-remote': (basic, name) => { return new ww.Remote(basic, name, transport); },
            'ww-channel': (remote, name) => { return new ww.Channel(remote, name); },
            'ww-ui': (channel, name) => { return new ww.UI(channel, name); },
            'ww-item': (ui, channel, element, name) => { ui.AddItem(channel, element, name); }
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
