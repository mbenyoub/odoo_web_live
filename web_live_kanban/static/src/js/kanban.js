openerp.web_live_kanban = function (instance) {

    instance.web_kanban.KanbanView.include({
        start: function() {
            this._super.apply(this, arguments);
            var self = this;
            this.card_to_create = [];
            instance.web.longpolling_socket.on('live_create', function (event) {
                if (self.dataset._model.name == event.model) {
                    if (!self.live_get_card(event.id)) {
                        self.live_card_is_in_domain_search(event.id)
                        .then( function () {
                            self.live_create_card(event);
                        })
                    }
                }
            });
            instance.web.longpolling_socket.on('live_write', function (event) {
                if (self.dataset._model.name == event.model) {
                    _(event.ids).each(function (id) {
                        var card = self.live_get_card(id);
                        self.live_card_is_in_domain_search(id)
                        .then( function () {
                            if (card) {
                                var group_id = event[self.group_by] || card.group.value;
                                var sequence = self.live_get_sequence(event, card);
                                self.live_card_moved(card, group_id, sequence);
                                card.do_reload();
                            } else {
                                if (_.indexOf(self.card_to_create, id) == -1) {
                                    event.id = id;
                                    if (event[self.group_id]) {
                                        self.live_create_card(event);
                                    } else {
                                        console.log('Make to get group by')
                                    }
                                }
                            }
                        })
                        .fail( function () {
                            if (card) {
                                self.live_remove_card(card);
                            }
                        });
                    });
                }
            });
            instance.web.longpolling_socket.on('live_unlink', function (event) {
                if (self.dataset._model.name == event.model) {
                    _(event.ids).each(function (id) {
                        card = self.live_get_card(id);
                        self.live_remove_card(card);
                    });
                }
            });
        },
        live_create_card: function(liveevent) {
            var self = this;
            this.card_to_create.push(liveevent.id);
            group = self.live_get_group(liveevent[this.group_by]);
            if (group) {
                group.dataset.read_ids([liveevent.id], group.view.fields_keys)
                .done(function (records) {
                    group.view.dataset.ids.push(liveevent.id);
                    group.do_add_records(records);
                    var card = self.live_get_card(liveevent.id);
                    var sequence = self.live_get_sequence(liveevent, card);
                    var group_by = liveevent[self.group_by];
                    self.live_card_moved(card, group_by, sequence);
                    var index = _.indexOf(self.card_to_create, liveevent);
                    self.card_to_create.splice(index, 1);
                });
            }; 
        },
        live_remove_card: function(card) {
            card.group.remove_record(card.id);
            card.destroy(); 
        },
        live_card_moved: function(card, group_id, sequence) {
            // reorder card in group at the new sequence
            var old_group = card.group;
            var new_group = null;
            var old_sequence = _.indexOf(old_group.records, card);
            if (card.group.value == group_id) {
                new_group = old_group;
            } else {
                _(this.groups).each(function (group) {
                    if (group.value == group_id) {
                        new_group = group;
                    }
                });
                card.group = new_group;
            }
            if (old_sequence != sequence || old_group != new_group) {
                // move the ticket
                old_group.records.splice(old_sequence, 1);
                new_group.records.splice(sequence, 0, card);

                var $old_group = old_group.$records.find('.oe_kanban_column_cards');
                $old_group.children()[old_sequence].remove();
                var $new_group = new_group.$records.find('.oe_kanban_column_cards');

                if ($new_group.children().length <= sequence || $new_group.children().length == 0) {
                    card.$el.appendTo($new_group);
                } else {
                    card.$el.insertBefore($new_group.children()[sequence]);
                }
            }
        },
        live_get_group: function(id) {
            var g = null;
            _(this.groups).each(function (group) {
                if (group.value == id) {
                    g = group;
                }
            });
            return g;
        },
        live_get_card: function(id) {
            var card = null;
            _(this.groups).each(function (group) {
                _(group.records).each(function (record) {
                    if (record.id == id) {
                        card = record;
                    }
                });
            });
            return card;
        },
        live_get_sequence: function(liveevent, card) {
            var sequence = card.group.records.length;
            if (liveevent.sequence != undefined) {
                sequence = liveevent.sequence;
            } else {
                if (card.record.sequence) {
                    sequence = card.record.sequence.raw_value;
                }
            }
            return sequence;
        },
        live_card_is_in_domain_search: function(id) {
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
    });
};