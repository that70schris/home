import { _Kube } from '..';

export class Plex extends _Kube {
  override image = 'linuxserver/plex';
  override container_port = 32400;
  override service_port = 443;

  override get volumes() {
    return super.volumes.concat([{
      name: 'config',
      hostPath: {
        path: '/home/chris/.config/plex',
      },
    }]);
  }

  override get volume_mounts() {
    return super.volume_mounts.concat([{
      name: 'config',
      mountPath: '/config',
    }]);
  }

  override includes = [
    this.service,
  ];
}
