import { _Cluster } from './kubernetes';
import { Homebridge, Plex } from './kubernetes/kubes';

new _Cluster('berry', {
  domain: 'bailey.mx',
  includes: [
    new Homebridge(),
    new Plex(),
  ],
});
