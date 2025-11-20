import { KubernetesResource } from './kubernetes';

export class Plex extends KubernetesResource {
  override image = 'lscr.io/linuxserver/plex';
  override container_port: number = 32400;
  override service_port: number = 80;
}
