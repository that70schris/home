import { _Cluster } from './kubernetes/_cluster';
import { Homebridge, Plex } from './kubernetes/kubes';

new _Cluster('berry', {
  includes: [
    new Homebridge(),
    new Plex(),
  ],
}).ingress;
