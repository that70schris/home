import { _Cluster } from '../../shared/models/kubernetes'
import { Talos } from '../Talos'

const berry = new Talos('berry')

new _Cluster(berry.name, {
  domain: berry.host,
  // ip: berry.host,
  kubes: [
    // new Homebridge(),
    // new Homey(),
    // new Plex(),
  ],
})
