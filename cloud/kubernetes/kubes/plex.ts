import { _Kube } from '..';

export class Plex extends _Kube {
  override image = 'linuxserver/plex';
  override container_port = 32400;
  override service_port = 443;

  override includes = [
    this.service,
  ];
}
