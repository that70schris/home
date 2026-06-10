import { _Cluster } from '../shared/models/kubernetes'
import { Homebridge, Plex } from '../shared/models/kubernetes/kubes'
import { Test } from '../shared/models/kubernetes/kubes/Test'
import { Talos } from '../shared/models/Talos'
import { Twingate } from '../shared/models/twingate'

Twingate

const berry = new Talos('berry')
new _Cluster(berry.name, {
  domain: 'bailey.mx',
  host: berry.host,
  ip: '192.168.0.5',
  // ip: berry.host,
  kubes: [
    new Homebridge(),
    // new Homey(),
    new Plex(),
    new Test(),
  ],
})
