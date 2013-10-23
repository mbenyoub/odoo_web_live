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
                            group.dataset.read_ids([live.id], group.view.fields_keys)
                            .done(function (records) {
                                group.view.dataset.ids.push(live.id);
                                group.do_add_records(records);
                                _(group.records).each(function (record) {
                                    if (record.id == live.id) {
                                        self.live_DndD_moved(record, live[self.group_by], live['sequence'] || record.record.sequence.raw_value);
                                    }
                                });
                            }); 
                        }
                    });
                }
            });
            instance.web.longpolling_socket.on('live_write', function (live) {
                if (self.dataset._model.name == live.model) {
                    _(live.ids).each(function (id) {
                        _(self.groups).each(function (group) {
                            _(group.records).each(function (record) {
                                if (record.id == id) {
                                    group_id = live[self.group_by] || record.group.value;
                                    sequence = live.sequence || record.record.sequence.raw_value;
                                    self.live_DndD_moved(record, group_id, sequence)
                                    record.do_reload();
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
        live_DndD_moved: function(record, group_id, sequence) {
            // reorder record in group at the new sequence
            var old_group = record.group;
            var new_group = null;
            var old_sequence = _.indexOf(old_group.records, record);
            if (record.group.value == group_id) {
                new_group = old_group;
            } else {
                _(this.groups).each(function (group) {
                    if (group.value == group_id) {
                        new_group = group;
                    }
                });
                record.group = new_group;
            }
            if (old_sequence != sequence || old_group != new_group) {
                // move the ticket
                old_group.records.splice(old_sequence, 1);
                new_group.records.splice(sequence, 0, record);

                var $old_group = old_group.$records.find('.oe_kanban_column_cards');
                $old_group.children()[old_sequence].remove();
                var $new_group = new_group.$records.find('.oe_kanban_column_cards');

                if ($new_group.children().length <= sequence || $new_group.children().length == 0) {
                    record.$el.appendTo($new_group);
                } else {
                    record.$el.insertBefore($new_group.children()[sequence]);
                }
            }
        },
    });
};
