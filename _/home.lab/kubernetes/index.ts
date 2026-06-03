import { _Cluster } from '../../shared/models/kubernetes'
import { Homebridge } from '../../shared/models/kubernetes/kubes'
import { Talos } from '../Talos'

const berry = new Talos('berry')

new _Cluster(berry.name, {
  host: berry.host,
  // ip: berry.host,
  kubes: [
    new Homebridge(),
    // new Homey(),
    // new Plex(),
  ],
})
