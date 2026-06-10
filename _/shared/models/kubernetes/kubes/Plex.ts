import { core } from '@pulumi/kubernetes/types/input'
import { Config, Resource } from '@pulumi/pulumi'
import { _Kube, _KubeSpec } from '..'

export class Plex extends _Kube {

  constructor(
    overrides: _KubeSpec = {
      image: 'linuxserver/plex',
      container_port: 32400,
      service_port: 443,
      gateway: true,
      https: true,
    },
  ) {
    super(overrides)
  }

  override get volumes() {
    return super.volumes.concat([{
      name: 'config',
      hostPath: {
        path: '/var/mnt/u-local/plex',
      },
    }])
  }

  override get volume_mounts() {
    return super.volume_mounts.concat([{
      mountPath: '/config',
      name: 'config',
    }])
  }

  override get environment(): core.v1.EnvVar[] {
    return super.environment.concat([
      {
        name: 'PLEX_CLAIM',
        value: new Config('plex').get('token'),
      },
    ])
  }

  override get index(): Resource[] {
    return [
      this.service,
    ]
  }
}
