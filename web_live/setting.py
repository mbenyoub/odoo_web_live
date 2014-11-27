# -*- coding: utf-8 -*-

from openerp.osv import osv, fields
from lxml.etree import Element, SubElement, tostring


MODULES_TYPES = [
    ('kanban', 'module_web_live_kanban'),
]


LIVE_STATE = [
    ('kanban', 'Kanban'),
    # ('from', 'Form'),
    # ('tree', 'Tree'),
]


class WebLiveModelConfig(osv.Model):
    _name = 'web.live.model.config'
    _description = 'Configuration by model'

    _columns = {
        'model_id': fields.many2one('ir.model', 'Model', required=True),
        'state': fields.selection(LIVE_STATE, 'State', required=True),
        'selected': fields.boolean('Selected'),
    }


class WebLiveConfig(osv.TransientModel):
    _name = 'web.live.config'
    _description = 'Web live config'
    _inherit = 'res.config.settings'

    _columns = {
        # View module
        'module_web_live_kanban': fields.boolean('Kanban'),
        # 'module_web_live_form': fields.boolean('from'),
        # 'module_web_live_tree': fields.boolean('tree'),

        # Module linked and model linked
        'module_live_crm': fields.boolean('CRM'),
        'live_crm_lead_kanban': fields.boolean(
            'CRM lead / Kanban', required=True, module='live_crm', view_type='kanban'),
        # ...
    }

    def default_get(self, cr, uid, fields, context=None):
        res = super(WebLiveConfig, self).default_get(cr, uid, fields,
                                                     context=context)
        mod_obj = self.pool.get('web.live.model.config')
        mod_ids = mod_obj.search(cr, uid, [], context=context)
        mods = {}
        for mod in mod_obj.browse(cr, uid, mod_ids, context=context):
            if mod.model_id.model not in mods:
                mods[mod.model_id.model] = {}

            mods[mod.model_id.model][mod.state] = mod.selected

        for name in fields:
            if name.startswith('live_'):
                column = self._columns[name]
                has_module = hasattr(column, 'module')
                has_view_type = hasattr(column, 'view_type')
                if has_module and has_view_type:
                    model = name[5:]
                    model = '.'.join(model.split('_')[:-1])
                    vtype = column.view_type

                    res[name] = mods.get(model, {}).get(vtype, False)

        return res

    def execute(self, cr, uid, ids, context=None):
        res = super(WebLiveConfig, self).execute(cr, uid, ids, context=context)
        read = self.read(cr, uid, ids[0], [], context=context)
        mod_obj = self.pool.get('web.live.model.config')
        for name in read.keys():
            if name.startswith('live_'):
                column = self._columns[name]
                has_module = hasattr(column, 'module')
                has_view_type = hasattr(column, 'view_type')
                if has_module and has_view_type:
                    model = name[5:]
                    model = '.'.join(model.split('_')[:-1])
                    vtype = column.view_type

                    mod_ids = mod_obj.search(
                        cr, uid, [('model_id.model', '=', model),
                                  ('state', '=', vtype)], context=context)
                    if mod_ids:
                        mod_obj.write(cr, uid, mod_ids, {
                            'selected': read[name]}, context=context)
                    else:
                        model_ids = self.pool.get('ir.model').search(
                            cr, uid, [('model', '=', model)], context=context)

                        if not model_ids:
                            continue

                        mod_obj.create(cr, uid, dict(
                            model_id=model_ids[0], state=vtype,
                            selected=read[name]), context=context)

        return res

    def parse_live(self, cr, uid, context=None):
        modules = {}
        types = dict(kanban=[])

        columns = self._columns.items()
        columns.sort()

        for name, column in columns:
            has_module = hasattr(column, 'module')
            has_view_type = hasattr(column, 'view_type')
            if name.startswith('live_') and has_module and has_view_type:
                if column.module not in modules:
                    modules['module_%s' % column.module] = []

                modules['module_%s' % column.module].append(
                    (column.view_type, name))

                types[column.view_type].append(name)

        return modules, types

    def fields_view_get(self, cr, uid, view_id=None, view_type='form',
                        context=None, toolbar=False, submenu=False):
        if view_type != 'form':
            return super(WebLiveConfig, self).fields_view_get(
                cr, uid, view_id=view_id, view_type=view_type, context=context,
                toolbar=toolbar, submenu=submenu)

        def sets(node, attributes):
            for key, value in attributes:
                node.set(key, value)

        models_by_modules, models_by_type = self.parse_live(
            cr, uid, context=context)

        form = Element('form')
        sets(form, (('string', 'Web live'), ('version', '7.0')))

        header = SubElement(form, 'header')

        bapply = SubElement(header, 'button')
        sets(bapply, (('string', 'Apply'), ('type', 'object'),
                      ('name', 'execute'), ('class', 'oe_highlight')))

        bcancel = SubElement(header, 'button')
        sets(bcancel, (('string', 'Cancel'), ('type', 'object'),
                       ('name', 'cancel'), ('class', 'oe_link')))

        group = SubElement(form, 'group')
        sets(group, (('string', 'Type of view'), ))
        for vtype, module in MODULES_TYPES:
            field = SubElement(group, 'field')
            sets(field, (('name', module),
                         ('on_change', "onchange_type(%s, '%s')" % (
                             module, "', '".join(models_by_type[vtype])))))

        modules = self._get_classified_fields(cr, uid, context=context)
        modules = [x for x in modules['module']
                   if x[0] not in [y[1] for y in MODULES_TYPES]]

        for module, record in modules:
            if record is None:
                continue

            models = models_by_modules.get(module, [])

            group = SubElement(form, 'group')
            sets(group, (('string', record.shortdesc), ('col', '4')))

            field = SubElement(group, 'field')
            sets(field, (('name', module),
                         ('string', 'Install(ed) / uninstall(ed)'),
                         ('on_change', "onchange_module(%s, '%s')" % (
                             module, "', '".join([x[1] for x in models])))))

            sub_group = SubElement(group, 'group')
            sets(sub_group, (
                ('col', '2'),
                ('colspan', '2'),
            ))
            for vtype, model in models:
                field = SubElement(sub_group, 'field')
                mod_vtype = dict(MODULES_TYPES)[vtype]
                sets(field, (
                    ('name', model),
                    ('on_change', "onchange_model(%s, '%s', '%s')" % (
                        model, module, mod_vtype))))

        arch = tostring(form)
        fields = self.fields_get(cr, uid, context=context)
        tb = {'print': [], 'action': [], 'relate': []}

        return {
            'arch': arch,
            'fields': fields,
            'toolbar': tb,
        }

    def onchange_type(self, cr, uid, ids, active, *models):
        if active:
            return {}

        return {'value': dict((m, False) for m in models)}

    def onchange_module(self, cr, uid, ids, active, *models):
        if active:
            return {}

        return {'value': dict((m, False) for m in models)}

    def onchange_model(self, cr, uid, ids, active, *modules):
        if not active:
            return {}

        return {'value': dict((m, True) for m in modules)}
