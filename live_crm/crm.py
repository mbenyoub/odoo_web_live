# -*- coding: utf-8 -*-

from openerp.osv import osv


class CrmLead(osv.Model):

    _name = 'crm.lead'

    _inherit = [
        'crm.lead',
        'abstract.live',
    ]
    _web_live_comple_reload_field = ['stage_id', 'sequence']

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
