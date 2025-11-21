import { _Kube } from '..';

export class Homebridge extends _Kube {
  override image = 'ghcr.io/homebridge/homebridge';
  override container_port = 8581;
  override service_port = 80;

  override get volumes() {
    return super.volumes.concat([{
      name: 'config',
      hostPath: {
        path: '/home/chris/.config/homebridge',
      },
    }]);
  }

  override get volume_mounts() {
    return super.volume_mounts.concat([{
      name: 'config',
      mountPath: '/homebridge',
    }]);
  }

  override includes = [
    this.service,
  ];
}
