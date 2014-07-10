(function() {
    openerp.web.WebClient.include({
        declare_bus_channel: function() {
            this._super();
            var channel = 'web_live';
            this.on(channel, this, function(message) {
                var e = channel + '-' + message.model + '-';
                if (message.kanban) {
                    this.trigger(e + 'kanban', message);
                }
            });
            this.add_bus_channel(channel);
        },
    });
})();
