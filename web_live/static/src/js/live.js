(function() {
    openerp.web_live_event = undefined;

    openerp.web.WebClient.include({
        declare_bus_channel: function() {
            this._super();
            openerp.web_live_event = this;
            var channel = 'web_live_' + this.session.uid;
            this.on(channel, this, function(message) {
                var e = 'web_live-' + message.model + '-';
                if (message.kanban) {
                    this.trigger(e + 'kanban', message);
                }
            });
            this.add_bus_channel(channel);
        },
    });
})();
