import { _Cluster } from '../../shared/models/kubernetes'
import { Homebridge, Plex } from '../../shared/models/kubernetes/kubes'

new _Cluster('berry', {
  domain: 'bailey.mx',
  kubes: [
    new Homebridge(),
    new Plex(),
  ],
}).index
