# -*- coding: utf-8 -*-

from openerp.addons.web_longpolling.namespace import LongPollingNameSpace
from openerp.addons.web_socketio.session import AbstractAdapter


class LiveAdapter(AbstractAdapter):
    channel = 'weblive'

    def get(self, messages, uid):
        res = []
        for m in messages:
            res.append(m)
        return res


@LongPollingNameSpace.on('live', adapterClass=LiveAdapter, eventtype='connect')
def live_connect(session):
    from gevent import sleep
    while True:
        lives = session.listen(session.uid)
        session.validate(True)
        for live in lives:
            if live['method'] in ('create', 'write'):
                # let time to commit
                sleep(0.5)
            session.broadcast_event('live_' + live['method'], live)

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
