openerp.web_live_kanban = function (instance) {
    instance.web_kanban.KanbanView.include({
        start: function() {
            this._super.apply(this, arguments);
            var self = this;
            instance.web.longpolling_socket.on('live_create', function (live) {
                if (self.dataset._model.name == live.model) {
                    self.live_create(live.record);
                }
            });
            instance.web.longpolling_socket.on('live_write', function (live) {
                if (self.dataset._model.name == live.model) {
                    _(live.record).each(function (id) {
                        _(self.groups).each(function (group) {
                            _(group.records).each(function (record) {
                                if (record.id == id) {
                                    if (live.group_by != group.value) {
                                        self.live_unlink(id);
                                        self.live_create(id);
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
                    _(live.record).each(function (id) {
                        self.live_unlink(id);
                    });
                }
            });
        },
        live_create: function(record_id) {
            console.log('##############: create')
            var self = this;
            model = new instance.web.Model(this.dataset._model.name);
            model.call('read', [record_id, [this.group_by]], {load: '_classic_write'})
            .then(function (r) {
                _(self.groups).each(function (group) {
                    if (group.value == r[self.group_by]) {
                        _(group.records).each(function (record) {
                            if (record.id == record_id) {
                                console.log('return')
                                return;
                            }
                        });
                        console.log('create')
                        group.quick_created(record_id);
                    }
                });
            });
        },
        live_unlink: function(record_id) {
            console.log('##############: unlink')
            _(this.groups).each(function (group) {
                _(group.records).each(function (record) {
                    if (record.id == record_id) {
                        console.log('destroy')
                        group.remove_record(record_id);
                        record.destroy(); 
                    }
                });
            });
        }
    });
};
