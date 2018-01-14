var ww = ww || {};

(function () {
    class ResponseHandler {
        constructor() {
            this.response_ = null;
            this.callback_ = null;
        }
        Initialize(response, callback) {
            this.response_ = response;
            this.callback_ = callback;
        }
        Handle(response) {
            if (response.response === this.response_) {
                this.callback_(response);
                return true;
            }
            return false;
        }
    }

    class ResponseHandlers { // singleton
        constructor() {
            this.handlers_ = [];
        }
        Register(response, callback) {
            let handler = new ResponseHandler();
            handler.Initialize(response, callback);
            this.handlers_.push(handler);
            return handler;
        }
        Unregister(handler) {
            let index = handlers_.indexOf(handler);
            this.handlers_.splice(index, 1);
        }
        Dispatch(responses) {
            responses.forEach(response => {
                response.datetimeClient = new Date().toLocaleString();
                this.handlers_.forEach(handler => handler.Handler(response));
                // temporary compatibility
                if (response.id === -1) {
                    ww.Notifications.ProcessNotification(response);
                } else {
                    ww.Responses.ProcessResponse(response);
                }
            });
        }
    }

    ww.ResponseHandlers = new ResponseHandlers();

})();
