import { _Cluster } from '../shared/models/kubernetes'
import { Homebridge, Plex } from '../shared/models/kubernetes/kubes'
import { Test } from '../shared/models/kubernetes/kubes/Test'
import { Talos } from '../shared/models/Talos'
import { Twingate } from '../shared/models/twingate'

Twingate

const berry = new Talos('berry')
new _Cluster(berry.name, {
  domain: 'bailey.mx',
  ip: '192.168.0.5',
  host: berry.host,
  // ip: berry.host,
  kubes: [
    new Homebridge(),
    // new Homey(),
    new Plex(),
    new Test(),
  ],
})
