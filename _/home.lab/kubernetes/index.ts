import { _Cluster } from '../../shared/models/kubernetes'
import { Talos } from '../talos'

const berry = new Talos(
  'berry',
  // '192.168.0.5',
)

new _Cluster(berry.name, {
  domain: 'berry.home.lab',
  // ip: berry.host,
  kubes: [
    // new Homebridge(),
    // new Homey(),
    // new Plex(),
  ],
})
