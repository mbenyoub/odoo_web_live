(function() {
    var web_live = openerp.web_live = {};

    web_live.Notification = openerp.Widget.extend({
        init: function(parent) {
            var self = this;
            this._super(parent);
            this.bus = openerp.bus.bus;
            this.channel = 'web_live'
            this.bus.add_channel(this.channel)
            this.bus.on("notification", this, this.on_notification);
            this.bus.start_polling();
        },
        on_notification: function(notification) {
            var channel = notification[0];
            if (channel == this.channel) {
                var message = notification[1];
                var e = channel + '-' + message.model + '-';
                if (message.kanban) {
                    this.trigger(e + 'kanban', message);
                }
            }
        },
    });
    openerp.web.WebClient.include({
        show_application: function() {
            this._super();
            this.web_live = new web_live.Notification(this);
        },
    });
})();
