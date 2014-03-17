# -*- coding: utf-8 -*-

from openerp.osv import osv, fields


class WebLiveConfig(osv.TransientModel):
    _name = 'web.live.config'
    _description = 'Web live config'
    _inherit = 'res.config.settings'

    _columns = {
        # View module
        'module_web_live_kanban': fields.boolean('Kanban'),
        #'module_web_live_form': fields.boolean('from'),
        #'module_web_live_tree': fields.boolean('tree'),

        # Module link
        'module_live_crm': fields.boolean('CRM'),
        # ...
    }
