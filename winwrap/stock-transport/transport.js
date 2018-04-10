//FILE: transport.js

// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL
//
// This file contains confidential material.
//
// CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL // CONFIDENTIAL

// Copyright 2017-2018 Polar Engineering, Inc.
// All rights reserved.

define(function () {

    class Transport {

        constructor(serverip) {
            this.serverip_ = serverip;
            this.key_ = undefined;
            let hash = window.location.hash;
            if (hash) {
                let match = hash.toLowerCase().match(/\/key=([0-9a-f\-]*)/);
                if (match !== undefined && match.length === 2) {
                    this.key_ = match[1];
                }
            }
        }

        async SendAndReceiveAsync(requests, id) {
            let url = 'http://' + this.serverip_ + '/winwrap/poll/' + id;
            if (this.key_) {
                if (this.serverip_) {
                    url = 'http://' + this.serverip_ + '/winwrap/route/' + this.key_ + '/' + id;
                } else {
                    url = 'http://www.winwrap.com/web/webedit/remote.asp?key=' + this.key_ + '&id=' + id;
                }
            }

            return this._SendAsync(url, requests);
        }

        async SendAsync(requests, id) {
            let url = 'http://' + this.serverip_ + '/winwrap/request/' + id;
            if (this.key_) {
                if (this.serverip_) {
                    url = 'http://' + this.serverip_ + '/winwrap/route/request/' + this.key_ + '/' + id;
                } else {
                    url = 'http://www.winwrap.com/web/webedit/request.asp?key=' + this.key_ + '&id=' + id;
                }
            }

            return this._SendAsync(url, requests);
        }

        async GetResponseAsync(id) {
            let url = 'http://' + this.serverip_ + '/winwrap/response/' + id;
            if (this.key_) {
                if (this.serverip_) {
                    url = 'http://' + this.serverip_ + '/winwrap/route/response/' + this.key_ + '/' + id;
                } else {
                    url = 'http://www.winwrap.com/web/webedit/response.asp?key=' + this.key_ + '&id=' + id;
                }
            }

            return _SendAsync(url, '');
        }

        _SendAsync(url, requests) {
            let json = JSON.stringify(requests);
            let options = {
                type: 'POST',
                url: url,
                dataType: 'text',
                data: json,
                contentType: 'application/winwrap; charset=utf-8',
                beforeSend: jqXHR => {
                    // set request headers here rather than in the ajax 'headers' object
                    jqXHR.setRequestHeader('Accept', 'application/winwrap');
                },
                dataFilter: data => {
                    return JSON.parse(data);
                }
            };
            return new Promise((resolve, reject) => {
                $.ajax(options).done(resolve).fail(reject);
            });
        }
    }

    ww.Transport = Transport;

});
