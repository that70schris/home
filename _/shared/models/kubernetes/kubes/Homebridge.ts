import { readFileSync } from 'fs'
import { _Kube, _Port, KubeOverrides } from '..'

export class Homebridge extends _Kube {
  static config = JSON.parse(readFileSync(
    `${process.cwd()}/homebridge.json`,
    'utf-8',
  ))

  constructor(
    overrides: KubeOverrides = {
      image: 'homebridge/homebridge',
      container_port: Homebridge.config.platforms
        .find((p: any) => p.platform == 'config')?.port ?? 8581,
      service_port: 443,
    },
  ) {
    super(overrides)
  }

  override get ports() {
    return super.ports.concat([
      new _Port('bridge', {
        container: Homebridge.config.bridge?.port ?? 51826,
      }),
      new _Port('matter', {
        container: Homebridge.config.bridge?.matter?.port ?? 5530,
      }),
    ])
  }

  // override get volumes() {
  //   return super.volumes.concat([{
  //     name: 'config',
  //     hostPath: {
  //       path: '/home/chris/.config/homebridge',
  //     },
  //   }])
  // }

  // override get volume_mounts() {
  //   return super.volume_mounts.concat([{
  //     mountPath: '/homebridge',
  //     name: 'config',
  //   }])
  // }

  override get index() {
    return [
      this.service,
    ]
  }

}
