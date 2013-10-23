# -*- coding: utf-8 -*-

from openerp.osv import osv


class AbstractLive(osv.AbstractModel):
    _name = 'abstract.live'
    _description = 'Abstract Live'
    _inherit = [
        'postgres.notification',
    ]
    _postgres_channel = 'weblive'
    _web_live_comple_reload_field = []

    def create(self, cr, uid, values, context=None):
        id = super(AbstractLive, self).create(
            cr, uid, values, context=context)
        kwargs = dict(method='create', model=self._name)
        if self._web_live_comple_reload_field:
            res = self.read(cr, uid, id, self._web_live_comple_reload_field,
                            load='_classic_write', context=context)
            kwargs.update(res)
        self.notify(cr, uid, **kwargs)
        return id

    def write(self, cr, uid, ids, values, context=None):
        res = super(AbstractLive, self).write(cr, uid, ids, values, context=context)

        kwargs = dict(method='write', model=self._name, ids=ids)
        for f in self._web_live_comple_reload_field:
            if f in values.keys():
                kwargs[f] = values[f]

        self.notify(cr, uid, **kwargs)
        return res

    def unlink(self, cr, uid, ids, context=None):
        res = super(AbstractLive, self).unlink(cr, uid, ids, context=context)
        self.notify(cr, uid, method='unlink', ids=ids, model=self._name)
        return res

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
