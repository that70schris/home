import { Resource } from '@pulumi/pulumi'
import { _Kube } from '../../kubernetes'

export class Plex extends _Kube {
  override image = 'linuxserver/plex:latest'
  override container_port = 32400
  override service_port = 443
  override ingress = true

  override get volumes() {
    return super.volumes.concat([{
      name: 'config',
      hostPath: {
        path: '/home/chris/.config/plex',
      },
    }])
  }

  override get volume_mounts() {
    return super.volume_mounts.concat([{
      mountPath: '/config',
      name: 'config',
    }])
  }

  override get index(): Resource[] {
    return [
      this.service,
    ]
  }
}
