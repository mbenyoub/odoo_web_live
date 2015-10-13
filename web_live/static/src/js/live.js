odoo.define('web_live.live', function (require) {

var WebClient = require('web.WebClient');
var base_bus = require('bus.bus');

WebClient.include({
    declare_bus_channel: function() {
        this._super();
        var channel = 'web_live_' + this.session.uid;
        this.bus_on(channel, function(message) {
            var e = 'web_live-' + message.model + '-';
            if (message.kanban) {
                base_bus.bus.trigger(e + 'kanban', message);
            }
        });
        this.add_bus_channel(channel);
    },
});

});
