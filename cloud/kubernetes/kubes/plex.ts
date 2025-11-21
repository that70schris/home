import { Kube } from './_kube';

export class Plex extends Kube {
  override image = 'linuxserver/plex';
  override container_port = 32400;
  override service_port = 443;

  override includes = [
    this.service,
  ];
}
