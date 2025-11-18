import { KubernetesResource } from './kubernetes';

export class Plex extends KubernetesResource {
  override image = 'lscr.io/linuxserver/plex';
}
