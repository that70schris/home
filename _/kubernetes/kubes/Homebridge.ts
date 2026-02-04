import { Resource } from '@pulumi/pulumi'
import { readFileSync } from 'fs'
import { _Kube, _Port } from '..'

export class Homebridge extends _Kube {
  override image = 'homebridge/homebridge:latest'
  config = JSON.parse(readFileSync(
    '../.config/homebridge/config.json',
    'utf-8',
  ))

  override container_port = this.config.platforms
    .find((p: any) => p.platform == 'config')?.port ?? 8581

  override service_port = 443
  override ingress = true

  override get ports() {
    return super.ports.concat([
      new _Port('bridge', {
        container: this.config.bridge?.port ?? 51826,
      }),
    ])
  }

  override get volumes() {
    return super.volumes.concat([{
      name: 'config',
      hostPath: {
        path: '/home/chris/.config/homebridge',
      },
    }])
  }

  override get volume_mounts() {
    return super.volume_mounts.concat([{
      mountPath: '/homebridge',
      name: 'config',
    }])
  }

  override get index(): Resource[] {
    return [
      this.service,
    ]
  }
}
