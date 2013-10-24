openerp.web_live_kanban = function (instance) {

    function get_sequence(live, record) {
        console.log('To remove')
        var sequence = record.group.records.length;
        if (live.sequence != undefined) {
            sequence = live.sequence;
        } else {
            if (record.record.sequence) {
                sequence = record.record.sequence.raw_value;
            }
        }
        return sequence;
    }

    instance.web_kanban.KanbanView.include({
        start: function() {
            this._super.apply(this, arguments);
            var self = this;
            instance.web.longpolling_socket.on('live_create', function (live) {
                if (self.dataset._model.name == live.model) {
                    _(self.groups).each( function (group) {
                        console.log('to refactor');
                        if (group.value == live[self.group_by]) {
                            _(group.records).each(function (record) {
                                if (record.id == live.id) {
                                    // only if it is this browser who make the create
                                    return;
                                }
                            });
                            self.live_action_by_domain(live.id)
                            .then( function () {
                                group.dataset.read_ids([live.id], group.view.fields_keys)
                                .done(function (records) {
                                    group.view.dataset.ids.push(live.id);
                                    group.do_add_records(records);
                                    _(group.records).each(function (record) {
                                        if (record.id == live.id) {
                                            var sequence = get_sequence(live, record);
                                            self.live_DndD_moved(record, live[self.group_by], sequence);
                                        }
                                    });
                                }); 
                            })
                        }
                    });
                }
            });
            instance.web.longpolling_socket.on('live_write', function (live) {
                if (self.dataset._model.name == live.model) {
                    _(live.ids).each(function (id) {
                        console.log('To refactor')
                        var current_record = null;
                        _(self.groups).each(function (group) {
                            _(group.records).each(function (record) {
                                if (record.id == id) {
                                    current_record = record;
                                    // ##############################
                                    var group_id = live[self.group_by] || record.group.value;
                                    var sequence = get_sequence(live, record);
                                    self.live_DndD_moved(record, group_id, sequence);
                                    record.do_reload();
                                }
                            });
                        });
                        self.live_action_by_domain(id)
                        .then( function () {
                            if (current_record) {
                                console.log('Update card')
                            } else {
                                console.log('Create card')
                            }
                        })
                        .fail( function () {
                            if (current_record) {
                                console.log('Remove card')
                            } else {
                                console.log('Make nothing')
                            }
                        });
                    });
                }
            });
            instance.web.longpolling_socket.on('live_unlink', function (live) {
                if (self.dataset._model.name == live.model) {
                    _(live.ids).each(function (id) {
                        console.log('To replace by live_get_card + live_remove_card')
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
        live_action_by_domain: function(id) {
            console.log('To remove')
            var def = $.Deferred();
            var domain = [].concat(this.search_domain, [['id', '=', id]]);
            this.dataset._model.call('search', [domain]).then( function(ids) {
                if (ids.length) {
                    def.resolve();
                } else {
                    def.reject();
                }
            });
            return def;
        },
        live_DndD_moved: function(record, group_id, sequence) {
            console.log('To remove')
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
        live_create_card: function(liveevent) {
            console.log('Create a card');
        },
        live_remove_card: function(id) {
            console.log('Remove a card');
        },
        live_card_moved: function(card, group_id, sequence) {
            console.log('New name of live_DndD_moved');
        },
        live_get_group: function(id) {
            console.log('Return the group');
        },
        live_get_card: function(id) {
            console.log('Return the card');
        },
        live_get_sequence: function(liveevent) {
            console.log('New fnct of get_sequence');
        },
        live_card_is_in_domain_search: function(id) {
            console.log('New name of live_action_by_domain')
        },
    });
};
