import { _Cluster } from '../shared/models/kubernetes'
import { Homebridge } from '../shared/models/kubernetes/kubes/Homebridge'
import { Plex } from '../shared/models/kubernetes/kubes/Plex'
import { Talos } from '../shared/models/Talos'
import { Twingate } from '../shared/models/twingate'

export const twingate = new Twingate('home.lab')
const berry = new Talos('berry')
new _Cluster(berry.name, {
  domain: 'bailey.mx',
  ip: '192.168.0.5',
  host: berry.host,
  kubes: [
    new Homebridge(),
    // new Homey(),
    new Plex(),
  ],
})
