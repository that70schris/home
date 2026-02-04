import { _Cluster } from '../../_/kubernetes'
import { Homebridge, Plex } from '../../_/kubernetes/kubes'

new _Cluster('berry', {
  domain: 'bailey.mx',
  kubes: [
    new Homebridge(),
    new Plex(),
  ],
}).index
