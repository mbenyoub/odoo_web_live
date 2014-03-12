# -*- coding: utf-8 -*-

from openerp.osv import osv


class CrmLead(osv.Model):

    _name = 'crm.lead'

    _inherit = [
        'crm.lead',
        'abstract.live',
    ]

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
