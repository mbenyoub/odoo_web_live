from openerp import models, api


class AbstractLive(models.AbstractModel):
    _name = 'abstract.live'
    _description = 'Abstract Live'

    @api.model
    def notify(self, kwargs):
        kwargs.update({
            'model': self._name,
            'user_id': self.env.uid,
        })
        mods = self.env['web.live.model.config'].search(
            [('model.model', '=', self._name)])
        kwargs.update({r.view_type: r.isselected for r in mods})
        self.env['bus.bus'].sendon('web_live', kwargs)

    @api.model
    def create(self, values):
        res = super(AbstractLive, self).create(values)
        kwargs = dict(ids=[res.id])
        kwargs.update(res.read(load='_classic_write')[0])
        self.notify(kwargs)
        return res

    @api.multi
    def write(self, values):
        res = super(AbstractLive, self).write(values)
        kwargs = dict(ids=[x.id for x in self])
        kwargs.update(values)
        self.notify(kwargs)
        return res

    @api.multi
    def unlink(self):
        res = super(AbstractLive, self).unlink()
        self.notify(ids=[x.id for x in self])
        return res

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
