define(function () {
    class Channel {
        constructor(remote, name) {
            this.Remote = remote;
            this.Name = name;
            this.UI = undefined;
            this.ClientID = ('0000000000' + Math.floor(Math.random() * 2147483647)).slice(-10).toString();
            this.AllocatedID = 0; // explicitly set in ?attach
            this.generation_ = 0;
        }
        Initialize() {
            this._AttachAsync().then(attach => {
                if (attach.unique_name !== this.ClientID) {
                    alert('Attach failed.');
                    return;
                }
                this.AllocatedID = attach.allocated_id;
                this.Version = attach.version;

                this.CommitRebase = new ww.CommitRebase(this);
                this.UI.Initialize();

                this.StartPolling();
                this.PushPendingRequest({ command: '?opendialog', dir: '\\', exts: 'wwd|bas' });
                this.PushPendingRequest({ command: '?stack' });
            }); // now UI is initialized
        }
        async _AttachAsync() {
            let request = { command: '?attach', version: '10.40.001', unique_name: this.ClientID };
            return await this.SendAsync(request, '!attach').catch(err => {
                console.log('ERROR channel.js _AttachAsync ', err);
            });
        }
        PushPendingRequest(request) {
            if (request) {
                request.datetime = new Date().toLocaleString();
                request.id = this.AllocatedID;
                request.gen = this._NextGeneration();
                this.Remote.PushPendingRequest(request);
            }
        }
        async SendAsync(request, expected) {
            request.datetime = new Date().toLocaleString();
            request.id = this.AllocatedID;
            request.gen = this._NextGeneration();
            return await this.Remote.SendAsync(request, expected, request.id);
        }
        StartPolling() {
            this.Remote.StartPolling();
        }
        StopPolling() {
            this.Remote.StopPolling();
        }
        _NextGeneration() {
            if (++this.generation_ == 0x10000)
                this.generation_ = 1; // 16 bit number (never 0)
            return this.generation_;
        }
    }

    ww.Channel = Channel;
});
