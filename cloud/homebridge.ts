import { KubernetesResource } from './kubernetes';

export class Homebridge extends KubernetesResource {
  override image = 'ghcr.io/homebridge/homebridge:latest';
}
