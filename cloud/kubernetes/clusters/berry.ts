import { _Ingress } from '../ingress';
import { Homebridge, Plex } from '../kubes';
import { Cluster } from './_cluster';

export class Berry extends Cluster {
  override includes = [
    new Homebridge(),
    new Plex(),
  ];

  ingress = new _Ingress('berry', {
    rules: [{
      host: 'berry',
      http: {
        paths: this.includes.map(service => ({
          path: `/${service.name}`,
          pathType: 'Prefix',
          backend: service.backend,
        })),
      },
    }],
  }, {
    issuer: this.issuer,
  });
}
