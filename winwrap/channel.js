define(function () {
    class Channel {
        constructor(remote, name) {
            this.Remote = remote;
            this.Name = name;
            this.UI = undefined;
            this.ClientID = ('0000000000' + Math.floor(Math.random() * 2147483647)).slice(-10).toString();
            this.AllocatedID = 0; // explicitly set in ?attach
            this.Version = undefined;
            this.generation_ = 0;
            this.commitcounter_ = 0;
            this.busy_ = false;
        }
        async InitializeAsync() {
            while (this.busy_)
                this.Remote._Wait(100);

            this.busy_ = true;
            let request = { command: '?attach', version: '10.40.001', unique_name: this.ClientID };
            let attach = undefined;
            try {
                attach = await this.SendAsync(request, '!attach');
            } catch (err) {
                console.log('ERROR channel.js _AttachAsync ', err);
            }
            this.busy_ = false;
            if (attach.unique_name !== this.ClientID) {
                alert('Attach failed.');
                return;
            }
            this.AllocatedID = attach.allocated_id;
            this.Version = attach.version;

            this.CommitRebase = new ww.CommitRebase(this);
            this.UI.Initialize();

            this.PushPendingRequest({ command: '?opendialog', dir: '\\', exts: 'wwd|bas' });
            this.PushPendingRequest({ command: '?stack' });
            // now UI is initialized
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
            //return await this.Remote.SendAsync(request, expected, request.id);
            let result = await this.Remote.SendAsync(request, expected, request.id);
            console.log(`Channel.SendAsync expected = ${expected}`);
            return result;
        }
        Poll() {
            if (++this.commitcounter_ === 20) {
                // push any pending commits (approx once every 2 seconds)
                this.PushPendingCommit();
                this.commitcounter_ = 0;
            }
        }
        PushPendingCommit() {
            this.PushPendingRequest(this.CommitRebase.GetCommitRequest());
        }
        _NextGeneration() {
            if (++this.generation_ === 0x10000)
                this.generation_ = 1; // 16 bit number (never 0)
            return this.generation_;
        }
    }

    ww.Channel = Channel;
});
