define([
    './ajax',
    './autoauto',
    './autocomplete',
    './breakspause',
    './commitrebase',
    './debugdecorate',
    './interface',
    './monacoeditor',
    './notifications',
    './responses',
    './signaturehelp',
    './ww-commit',
    './ww-doc',
    './ww-edit',
    './ww-edits'], function () {
        class Basic {
            constructor(top) {
                this.Top = top;
                this.ClientID = ('0000000000' + Math.floor(Math.random() * 2147483647)).slice(-10).toString();
                this.AllocatedID = 0; // explicitly set in ?attach
                this.generation_ = 0;
                this.EditorImmediate = ww.MonacoEditor(this, "immediate-editor", 150);
                this.EditorWatch = ww.MonacoEditor(this, "watch-editor", 125);
                let editor = this.LocateElement("code-editor").first();
                let version = this.LocateElement("version").first();
                let editorHeight = $(window).height() - editor.position().top - version.height();
                this.EditorCode = ww.MonacoEditor(this, "code-editor", editorHeight);
                this.EditorCode.bindOnMouseDown();

                this.AutoAuto = new ww.AutoAuto(this);
                this.AutoComplete = new ww.AutoComplete(this);
                this.BreaksPause = new ww.BreaksPause(this);
                this.CommitRebase = new ww.CommitRebase(this);
                this.DebugDecorate = new ww.DebugDecorate(this);
                this.Interface = new ww.Interface(this); // bind interface elements only when document ready
                this.Notifications = new ww.Notifications(this);
                this.Responses = new ww.Responses(this);
                this.SignatureHelp = new ww.SignatureHelp(this);

                var loading = this.LocateElement("loading").first();
                var text = loading.text();
                loading.text("loading...");
                this.AttachAsync().then(attach => {
                    this.Interface.Initialize(this);
                    this.Interface.WinWrapVersion.SetValue(attach.version);
                    this.AutoComplete.Register();
                    this.SignatureHelp.Register();
                    loading.text(text);
                    //this.Test = new ww.TestPrototype(this, ww.EditorCode);
                    this.StartPolling();
                    this.PushPendingRequest({ command: "?opendialog", dir: "\\", exts: "wwd|bas" });
                    this.PushPendingRequest({ command: "?stack" });
                }); // now UI is initialized
            }
            async AttachAsync() {
                let request = { command: "?attach", version: "10.40.001", unique_name: this.ClientID };
                let attach = await this.SendAsync(request, "!attach").catch(err => {
                    console.log("ERROR basic.js Attachsync ", err);
                });
                this.Response = attach;
                this.AllocatedID = attach.allocated_id;
                return attach;
            }
            Generation() {
                if (++this.generation_ == 0x10000)
                    this.generation_ = 1; // 16 bit number (never 0)
                return this.generation_;
            }
            LocateElement(elementname) {
                return this.Top.find(".ww-" + elementname);
            }
            PushPendingRequest(request) {
                if (request) {
                    request.datetime = new Date().toLocaleString();
                    request.id = this.AllocatedID;
                    request.gen = this.Generation();
                    ww.Basics.Ajax.PushPendingRequest(request);
                }
            }
            async SendAsync(request, expected) {
                request.datetime = new Date().toLocaleString();
                request.id = this.AllocatedID;
                request.gen = this.Generation();
                return await ww.Basics.Ajax.SendAsync(request, expected, request.id);
            }
            StartPolling() {
                ww.Basics.Ajax.StartPolling();
            }
            StopPolling() {
                ww.Basics.Ajax.StopPolling();
            }
        }

        class Basics { // singleton
            constructor() {
                this.Ajax = null;
                this.basics_ = [];
                this.pollingIndex_ = -1;
            }
            Initialize(serverip) {
                this.Ajax = new ww.Ajax(serverip);
                $(".ww-basic").each((index, elem) => {
                    this.basics_.push(new Basic($(elem), serverip));
                });
            }
            NextPollingId() {
                if (++this.pollingIndex_ >= this.basics_.length)
                    this.pollingIndex_ = 0;
                return this.pollingIndex_ < this.basics_.length ? this.basics_[this.pollingIndex_].AllocatedID : 0;
            }
            Process(responses) {
                responses.forEach(response => {
                    response.datetimeClient = new Date().toLocaleString();
                    if (response.id === -1) {
                        // all basic's process the notification
                        this.basics_.forEach(basic => {
                            basic.Notifications.Process(response);
                        });
                    } else {
                        // response is for a particular basic
                        let basic = this.basics_.find(basic => basic.AllocatedID === response.id);
                        if (basic != null) {
                            basic.Responses.Process(response);
                        }
                    }
                });
            }
        }

        ww.Basics = new Basics();
});
