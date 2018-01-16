define(function () {

    class UI {
        constructor(channel, name) {
            this.Channel = channel;
            this.Name = name;
            this.items_ = {};
        }
        Initialize() {
            this.EditorImmediate = this.items_['ww-item-immediate'];
            this.EditorWatch = this.items_['ww-item-watch'];
            this.EditorCode = this.items_['ww-item-code'];
            this.Channel.CommitRebase.SetEditor(this.EditorCode);
            this.AutoAuto = new ww.AutoAuto(this, this.EditorCode);
            this.Breaks = new ww.Breaks(this);
            this.Stack = new ww.Stack(this);
            this.DebugDecorate = new ww.DebugDecorate(this);
            this.WinWrapVersion = new WinWrapVersion(this);
        }
        CreateItem(element, name) {
            switch (name) {
                case 'ww-item-new': return new ButtonNew(this, element);
                case 'ww-item-files': return new InputMacro(this, element);
                case 'ww-item-save': return new ButtonSave(this, element);
                case 'ww-item-check': return new ButtonCheck(this, element);
                case 'ww-item-run': return new ButtonRun(this, element);
                case 'ww-item-pause': return new ButtonPause(this, element);
                case 'ww-item-end': return new ButtonEnd(this, element);
                case 'ww-item-into': return new ButtonInto(this, element);
                case 'ww-item-over': return new ButtonOver(this, element);
                case 'ww-item-out': return new ButtonOut(this, element);
                case 'ww-item-cycle': return new ButtonCycle(this, element);
                case 'ww-item-immediate': return ww.MonacoEditor(this, element, 'immediate-editor', 150);
                case 'ww-item-watch': return ww.MonacoEditor(this, element, 'watch-editor', 125);
                case 'ww-item-code': return ww.MonacoEditor(this, element, 'code-editor', 500);
                case 'ww-item-statusbar': return undefined;
                case 'ww-item-version': return new WinWrapVersion(this);
            }
        }
        AddItem(item, name) {
            if (item !== undefined) {
                this.items_[name] = item;
            }
        }
        GetFileValue(response) {
            let item = this.items_['ww-item-files'];
            return item !== undefined ? item.GetFileValue() : '?A1';
        }
        SetFileValue(response) {
            let item = this.items_['ww-item-files'];
            if (item !== undefined) {
                item.SetFileValue(response);
            }
        }
        SetFileValues(response) {
            let item = this.items_['ww-item-files'];
            if (item !== undefined) {
                item.SetFileValues(response);
            }
        }
        SetState(response) {
            Object.values(this.items_).forEach(item => {
                item.SetState(response);
            });
            // update current line
            this.Stack.setStack(response);
        }
        ProcessNotification(notification) {
            switch (notification.response) { // each case => one requests
                case '!break': // notification
                    this.Breaks.setBreak(notification);
                    this.DebugDecorate.display();
                    break;
                case '!notify_begin': // notification
                    this.EditorImmediate.show();
                    this.SetState(notification);
                    break;
                case '!notify_debugclear': // notification
                    // need a this.EditorImmediate method to clear the immediate text
                    break;
                case '!notify_debugprint': // notification
                    this.EditorImmediate.appendText(notification.text);
                    this.EditorImmediate.scrollToBottom();
                    /*setTimeout(function () {
                        this.EditorImmediate.appendText(notification.text);
                        this.EditorImmediate.scrollToBottom();
                    }, 100);*/ // xxx
                    break;
                case '!notify_end': // notification
                    this.EditorImmediate.hide();
                    this.SetState(notification);
                    break;
                case '!notify_errorlog': // notification
                    break;
                case '!notify_errors': // notification
                    alert(notification.error.macro_name + '@' + notification.error.line_num + ': ' +
                        notification.error.line + '\n' + notification.error.desc);
                    if (this.Channel.CommitRebase.Name !== notification.error.macro_name) {
                        this.Channel.PushPendingRequest({ command: '?read', target: notification.error.macro_name });
                    }
                    // should highlight the error line in red and scroll to it
                    // notification.error.line_num
                    // notification.error.offset (index into the line where the error occurred, -1 for runtime error)
                    break;
                case '!notify_macrobegin': // notification
                    break;
                case '!notify_macroend': // notification
                    break;
                case '!notify_pause': // notification
                    if (this.Channel.CommitRebase.Name !== notification.file_name) {
                        this.Channel.PushPendingRequest({ command: '?read', target: notification.file_name });
                    }
                    let watches = this.EditorWatch.editor().getValue().trim().split(/[\r]?\n/).filter(el => { return el !== ''; });
                    if (watches.length >= 1) { // xxx
                        this.Channel.PushPendingRequest({ command: '?watch', watches: watches });
                    }
                    this.SetState(notification);
                    break;
                case '!notify_resume': // notification
                    this.SetState(notification);
                    break;
                case '!rebase': // notification
                    this.Channel.CommitRebase.Rebase(notification);
                    break;
                default:
                    break;
            }
        }
        ProcessResponse(response) {
            switch (response.response) { // each case => one requests
                case '!breaks': // response
                    this.Breaks.setBreaks(response);
                    break;
                case '!commit':
                    this.Channel.CommitRebase.CommitDone(response.revision);
                    break;
                case '!new': // response
                    this.Channel.PushPendingRequest({ command: '?read', target: response.name });
                    break;
                case '!opendialog': // response
                    this.SetFileValues(response.names.map(item => item.name));
                    break;
                case '!read': // response
                    // only read the first file
                    let file = response.files[0];
                    this.SetFileValue(file.name);
                    this.Channel.CommitRebase.Read(file);
                    this.Channel.PushPendingRequest({ command: '?breaks', target: file.name });
                    this.Channel.PushPendingRequest({ command: '?state', target: file.name });
                    break;
                case '!state': // response
                    this.SetState(response);
                    break;
                case '!stack': // response
                    this.Stack.setStack(response);
                    break;
                case '!syntax': // response
                    if (response.okay) {
                        alert('No syntax errors.');
                    }
                    break;
                case '!watch': // response
                    let watchResults = response.results.map(item => {
                        let value = item.error !== undefined ? item.error : item.value;
                        return `${item.depth}: ${item.expr} -> ${value}`;
                    }).join('\n');
                    this.EditorWatch.editor().setValue(watchResults);
                    break;
                case '!write': // response
                    break;
                default:
                    break;
            }
        }
    }

    ww.UI = UI;

    class Button_Helper {
        constructor(element, clickhandler) {
            this.element_ = element;
            this.element_.button(); // make sure the button is initialized
            if (clickhandler !== undefined) {
                this.element_.click(clickhandler);
            }
            this.Enabled(false);
        }
        Enabled(enable) {
            this.enabled_ = enable;
            this.element_.button(enable ? 'enable' : 'disable');
        }
        IsEnabled() {
            return this.enabled_;
        }
    }

    class ButtonNew {
        constructor(ui, element) {
            this.button_ = new Button_Helper(element,
                () => {
                    ui.Channel.PushPendingRequest({ command: '?new', kind: 'Macro', has_main: true, names: [] });
                });
        }
        SetState(response) {
            this.button_.Enabled(!response.macro_loaded);
        }
    }

    class InputMacro {
        constructor(ui, element) {
            //this.button_ = new Button_Helper(element);
            this.UI = ui;
            let channel = ui.Channel;
            this.macros_ = []; // xxx Macros
            this.element_ = element;
            let inputMacro = this; // closure can't handle this in the lambdas below
            this.element_.autocomplete({
                source: function (request, response) {
                    let term = $.ui.autocomplete.escapeRegex(request.term);
                    //console.log(term);
                    var matcher = new RegExp(`^.*${term}.*$`, 'i');
                    response($.grep(inputMacro.macros_, function (element) { // xxx
                        return matcher.test(element);
                    }));
                }
            });
            this.element_.on('autocompleteselect', function (event, ui) {
                channel.PushPendingRequest({ command: '?read', target: ui.item.value });
            });
        }
        SetState(response) {
            //this.button_.Enabled(!response.macro_loaded);
        }
        GetFileValue() {
            return this.element_.val();
        }
        SetFileValue(value) {
            this.element_.val(value);
        }
        SetFileValues(values) {
            this.macros_ = values;
            let channel = this.UI.Channel;
            if (values.find(item => item === '\\Sample1.bas')) {
                channel.PushPendingRequest({ command: '?read', target: '\\Sample1.bas' });
            }
            else {
                channel.PushPendingRequest({ command: '?new', names: [] });
            }
        }
    }

    class ButtonSave {
        constructor(ui, element) {
            let channel = ui.Channel;
            this.button_ = new Button_Helper(element,
                () => {
                    let code = channel.EditorCode.editor().getValue();
                    let name = channel.CommitRebase.Name;
                    let newname = ui.GetFileValue();
                    channel.PushPendingRequest(channel.CommitRebase.GetCommitRequest());
                    channel.PushPendingRequest({ command: '?write', target: name, new_name: newname });
                });
        }
        SetState(response) {
            this.button_.Enabled(true);
        }
    }

    class ButtonCheck {
        constructor(ui, element) {
            let channel = ui.Channel;
            this.button_ = new Button_Helper(element,
                () => {
                    channel.PushPendingRequest(channel.CommitRebase.GetCommitRequest());
                    channel.PushPendingRequest({ command: '?syntax', target: channel.CommitRebase.Name });
                });
        }
        SetState(response) {
            this.button_.Enabled(!response.macro_loaded);
        }
    }

    class ButtonRun {
        constructor(ui, element) {
            let channel = ui.Channel;
            this.button_ = new Button_Helper(element,
                () => {
                    channel.PushPendingRequest(channel.CommitRebase.GetCommitRequest());
                    channel.PushPendingRequest({ command: 'run', target: channel.CommitRebase.Name });
                });
        }
        SetState(response) {
            this.button_.Enabled(response.commands.run);
        }
    }

    class ButtonPause {
        constructor(ui, element) {
            let channel = ui.Channel;
            this.button_ = new Button_Helper(element,
                () => {
                    channel.PushPendingRequest({ command: 'pause', target: channel.CommitRebase.Name });
                });
        }
        SetState(response) {
            this.button_.Enabled(response.commands.pause);
        }
    }

    class ButtonEnd {
        constructor(ui, element) {
            let channel = ui.Channel;
            this.button_ = new Button_Helper(element,
                () => {
                    channel.PushPendingRequest({ command: 'end', target: channel.CommitRebase.Name });
                });
        }
        IsEnabled() {
            return this.button_.IsEnabled();
        }
        SetState(response) {
            this.button_.Enabled(response.commands.end);
        }
    }

    class ButtonInto {
        constructor(ui, element) {
            let channel = ui.Channel;
            this.button_ = new Button_Helper(element,
                () => {
                    channel.PushPendingRequest(channel.CommitRebase.GetCommitRequest());
                    channel.PushPendingRequest({ command: 'into', target: channel.CommitRebase.Name });
                });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
        SetState(response) {
            this.button_.Enabled(response.commands.into);
        }
    }

    class ButtonOver {
        constructor(ui, element) {
            let channel = ui.Channel;
            this.button_ = new Button_Helper(element,
                () => {
                    channel.PushPendingRequest(channel.CommitRebase.GetCommitRequest());
                    channel.PushPendingRequest({ command: 'over', target: channel.CommitRebase.Name });
                });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
        SetState(response) {
            this.button_.Enabled(response.commands.over);
        }
    }

    class ButtonOut {
        constructor(ui, element) {
            let channel = ui.Channel;
            this.button_ = new Button_Helper(element,
                () => {
                    channel.PushPendingRequest({ command: 'out', target: channel.CommitRebase.Name });
                });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
        SetState(response) {
            this.button_.Enabled(response.commands.out);
        }
    }

    class ButtonCycle {
        constructor(ui, element) {
            let channel = ui.Channel;
            this.button_ = new Button_Helper(element,
                () => { // xxx
                    let immediateShowing = ui.EditorImmediate.showing();
                    let watchShowing = ui.EditorWatch.showing();
                    if (!immediateShowing && !watchShowing) {
                        ui.EditorImmediate.hide();
                        ui.EditorWatch.show();
                    } else if (!immediateShowing && watchShowing) {
                        ui.EditorImmediate.show();
                        ui.EditorWatch.hide();
                    } else if (immediateShowing && !watchShowing) {
                        ui.EditorImmediate.show();
                        ui.EditorWatch.show();
                    } else if (immediateShowing && watchShowing) {
                        ui.EditorImmediate.hide();
                        ui.EditorWatch.hide();
                    }
                });
        }
        Enabled(enable) {
            this.button_.Enabled(enable);
        }
        SetState(response) {
            this.button_.Enabled(true);
        }
    }

    class WinWrapVersion {
        constructor(ui, element) {
            this.UI = ui;
            this.element_ = element;
            //this.element_.click(() => {
            //    let test001 = new Test001(this.Channel);
            //    test001.Run();
            //});
        }
        Initialize() {
            this.element_.text(this.UI.Channel.Version);
        }
        SetState(response) {
        }
    }

    class Browser {
        constructor() { }
        Log(json) {
            let text = JSON.stringify(json, undefined, 2);
            $('#jsondata').append(text + '<br />');
        }
    }

    ww.Browser = new Browser();

});
