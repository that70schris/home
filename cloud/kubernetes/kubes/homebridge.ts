import { _Kube } from './_Kube';

export class Homebridge extends _Kube {
  override image = 'ghcr.io/homebridge/homebridge';
  override container_port = 8581;
  override service_port = 80;

  override includes = [
    this.service,
  ];
}
