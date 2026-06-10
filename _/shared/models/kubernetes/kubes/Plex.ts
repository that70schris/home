import { Resource } from '@pulumi/pulumi'
import { _Kube, _KubeSpec } from '..'

export class Plex extends _Kube {

  constructor(
    overrides: _KubeSpec = {
      image: 'linuxserver/plex',
      container_port: 32400,
      service_port: 443,
      hostNetwork: true,
      gateway: true,
      https: true,
    },
  ) {
    super(overrides)
  }

  // override get volumes() {
  //   return super.volumes.concat([{
  //     name: 'config',
  //     hostPath: {
  //       path: '/var/mnt/u-local/plex',
  //     },
  //   }])
  // }

  // override get volume_mounts() {
  //   return super.volume_mounts.concat([{
  //     mountPath: '/config',
  //     name: 'config',
  //   }])
  // }

  override get index(): Resource[] {
    return [
      this.service,
    ]
  }
}
