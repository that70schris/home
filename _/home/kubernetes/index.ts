import { _Cluster } from '../../shared/models/kubernetes'
import { Homebridge, Plex } from '../../shared/models/kubernetes/kubes'
import { Homey } from '../../shared/models/kubernetes/kubes/Homey'

new _Cluster('berry', {
  domain: 'bailey.mx',
  ip: '195.168.0.5',
  kubes: [
    new Homebridge(),
    new Homey(),
    new Plex(),
  ],
}).index
