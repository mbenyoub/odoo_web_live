# -*- coding: utf-8 -*-

from openerp.osv import osv


class AbstractLive(osv.AbstractModel):
    _name = 'abstract.live'
    _description = 'Abstract Live'
    _inherit = [
        'postgres.notification',
    ]
    _postgres_channel = 'weblive'
    _web_live_comple_reload_field = None

    def create(self, cr, uid, values, context=None):
        id = super(AbstractLive, self).create(
            cr, uid, values, context=context)
        self.notify(cr, uid, method='create', record=id, model=self._name)
        return id

    def write(self, cr, uid, ids, values, context=None):
        res = super(AbstractLive, self).write(cr, uid, ids, values, context=context)

        group_by = values.get(self._web_live_comple_reload_field, False)

        self.notify(
            cr, uid, method='write', record=ids, model=self._name, group_by=group_by)
        return res

    def unlink(self, cr, uid, ids, context=None):
        res = super(AbstractLive, self).unlink(cr, uid, ids, context=context)
        self.notify(cr, uid, method='unlink', record=ids, model=self._name)
        return res

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
