export * from './_Cluster'
export * from './_ConfigMap'
export * from './_CustomResource'
export * from './_Ingress'
export * from './_Kube'
export * from './_Port'

import { _Cluster } from '../kubernetes'
import { Homebridge, Plex } from '../kubernetes/kubes'

new _Cluster('berry', {
  domain: 'bailey.mx',
  kubes: [
    new Homebridge(),
    new Plex(),
  ],
}).index
