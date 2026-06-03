import { Resource } from '@pulumi/pulumi'
import { _Kube, KubeOverrides } from '..'

export class Plex extends _Kube {

  constructor(
    overrides: KubeOverrides = {
      image: 'linuxserver/plex',
      container_port: 32400,
      service_port: 443,
      ingress: true,
    },
  ) {
    super(overrides)
  }

  // get volume() {
  //   return new PersistentVolume('plex')
  // }

  override get volumes() {
    return super.volumes.concat([{
      name: 'config',
      hostPath: {
        path: '/.config/plex',
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
