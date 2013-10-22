openerp.web_live_kanban = function (instance) {
    instance.web_kanban.KanbanView.include({
        start: function() {
            this._super.apply(this, arguments);
            var self = this;
            instance.web.longpolling_socket.on('live_create', function (live) {
                if (self.dataset._model.name == live.model) {
                    _(self.groups).each( function (group) {
                        if (group.value == live[self.group_by]) {
                            _(group.records).each(function (record) {
                                if (record.id == live.id) {
                                    // only if it is this browser who make the create
                                    return;
                                }
                            });
                            group.quick_created(live.id);
                        }
                    });
                }
            });
            instance.web.longpolling_socket.on('live_write', function (live) {
                if (self.dataset._model.name == live.model) {
                    _(live.record).each(function (id) {
                        _(self.groups).each(function (group) {
                            _(group.records).each(function (record) {
                                if (record.id == id) {
                                    if (live.group_by != group.value) {
                                        //self.live_unlink(id);
                                        //self.live_create(id);
                                    } else {
                                        record.do_reload();
                                    }
                                }
                            });
                        });
                    });
                }
            });
            instance.web.longpolling_socket.on('live_unlink', function (live) {
                if (self.dataset._model.name == live.model) {
                    _(live.ids).each(function (id) {
                        _(self.groups).each(function (group) {
                            _(group.records).each(function (record) {
                                if (record.id == id) {
                                    group.remove_record(id);
                                    record.destroy(); 
                                }
                            });
                        });
                    });
                }
            });
        },
    });
};
