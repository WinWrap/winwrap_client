define([
    './autoauto',
    './autocomplete',
    './breaks',
    './channel',
    './commitrebase',
    './debugdecorate',
    './monacoeditor',
    './remote',
    './signaturehelp',
    './stack',
    './syntax',
    './ui',
    './ui-items',
    './ww-commit',
    './ww-doc',
    './ww-edit',
    './ww-edits'], function () {
        class Basic {
            constructor() {
                this.remotes_ = {};
            }
            Initialize(factory) {
                let basic = this; // closure can't handle this in the lambdas below
                setTimeout(async () => {
                    await basic._InitializeAsync(factory);
                }, 100); // wait to initialize
            }
            async _InitializeAsync(factory) {
                Object.keys(factory).forEach(key => {
                    let prefix = key + '-';
                    let elements = $('[class*="' + prefix + '"]');
                    elements.each((index, element) => {
                        if (this.ClassName(element, prefix) === undefined) {
                            return; // protect against matching a prefix embedded class name
                        }
                        let remote = this.Remote(this.ClassName(element, 'ww-remote-'));
                        let channel = undefined;
                        let ui = undefined;
                        if (key !== 'ww-remote') {
                            if (remote === undefined) {
                                remote = this.Remote('ww-remote-1');
                                if (remote === undefined) {
                                    remote = factory['ww-remote'](this, 'ww-remote-1');
                                    this._AddRemote(remote);
                                }
                            }
                            channel = remote.Channel(this.ClassName(element, 'ww-channel-'));
                            if (key !== 'ww-channel') {
                                if (channel === undefined) {
                                    channel = remote.Channel('ww-channel-1');
                                    if (channel === undefined) {
                                        channel = factory['ww-channel'](remote, 'ww-channel-1');
                                        remote.AddChannel(channel);
                                    }
                                }
                                ui = channel.UI;
                                if (key !== 'ww-ui' && ui === undefined) {
                                    ui = factory['ww-ui'](channel, 'ww-ui-1');
                                    channel.UI = ui;
                                }
                            }
                        }
                        let name = this.ClassName(element, prefix);
                        switch (key) {
                            case 'ww-remote':
                                if (remote === undefined) {
                                    this._AddRemote(factory[key](this, name));
                                }
                                break;
                            case 'ww-channel':
                                if (channel === undefined) {
                                    remote.AddChannel(factory[key](remote, name));
                                }
                                break;
                            case 'ww-ui':
                                if (ui === undefined) {
                                    channel.UI = factory[key](channel, name);
                                }
                                break;
                            default:
                                let wrapped = $(element);
                                ui.AddItem(factory[key](ui, wrapped, name), name);
                                break;
                        }
                    });
                });
                Object.values(this.remotes_).forEach(async remote => {
                    await remote.InitializeAsync();
                });
            }
            ClassName(element, prefix, defaultName) {
                let className = undefined;
                element.classList.forEach(name => {
                    if (name.startsWith(prefix)) {
                        className = name;
                    }
                });
                return className !== undefined ? className : defaultName;
            }
            _AddRemote(remote) {
                this.remotes_[remote.Name] = remote;
            }
            Remote(name) {
                return this.remotes_[name];
            }
        }

        ww.Basic = Basic;
});
