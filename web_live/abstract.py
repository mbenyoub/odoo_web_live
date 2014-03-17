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
        kwargs = dict(model=self._name, ids=[id], user_id=uid)
        kwargs.update(
            self.read(cr, uid, id, [], load='_classic_write', context=context))

        self.committed_notify(cr, uid, **kwargs)
        return id

    def write(self, cr, uid, ids, values, context=None):
        res = super(AbstractLive, self).write(
            cr, uid, ids, values, context=context)

        kwargs = dict(model=self._name, ids=ids, user_id=uid)
        kwargs.update(values)

        self.committed_notify(cr, uid, **kwargs)
        return res

    def unlink(self, cr, uid, ids, context=None):
        res = super(AbstractLive, self).unlink(cr, uid, ids, context=context)
        self.committed_notify(cr, uid, ids=ids, model=self._name, user_id=uid)
        return res

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
