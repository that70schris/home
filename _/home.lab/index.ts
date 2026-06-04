import { _Cluster } from '../shared/models/kubernetes'
import { Homebridge } from '../shared/models/kubernetes/kubes'
import { Twingate } from '../shared/models/twingate'
import { Talos } from './Talos'

Twingate

const berry = new Talos('berry')
new _Cluster(berry.name, {
  host: berry.host,
  domain: 'bailey.mx',
  // ip: berry.host,
  kubes: [
    new Homebridge(),
    // new Homey(),
    // new Plex(),
  ],
})
