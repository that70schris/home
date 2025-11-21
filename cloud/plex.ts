import { KubernetesResource } from './kubernetes';

export class Plex extends KubernetesResource {
  override image = 'linuxserver/plex';
  override container_port: number = 32400;
  override service_port: number = 443;

  includes = [
    this.service,
  ];
}
