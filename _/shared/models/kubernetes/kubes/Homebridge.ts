import { _ConfigMap, _Kube, _Port, KubeOverrides } from '..'
import { once } from '../../../decorators'

export class Homebridge extends _Kube {
  static config = {
    bridge: {
      name: 'Homebridge',
      username: 'CC:22:3D:E3:CE:30',
      port: 51947,
      pin: '844-23-240',
      matter: {
        port: 5530,
      },
    },
    accessories: [],
    platforms: [
      {
        name: 'Config',
        platform: 'config',
        port: 8581,
        auth: 'none',
      },
    ],
  }

  constructor(
    overrides: KubeOverrides = {
      image: 'homebridge/homebridge',
      container_port: Homebridge.config.platforms
        .find((p: any) => p.platform == 'config')?.port ?? 8581,
      service_port: 8581,
      ingress: true,
    },
  ) {
    super(overrides)

  }

  @once
  get config() {
    return new _ConfigMap(this.name, {
      data: {
        'config.json': JSON.stringify(Homebridge.config),
        'auth.json': JSON.stringify([
          {
            id: 1,
            username: 'admin',
            name: 'admin',
            hashedPassword: '981dcc4d28cd5122ccdcf282a6a1017626b841f573e494f0fd2a49e0c8d9b3b3fb7a3de724c65c342e313cba2cfbfbd50f8cd13986baf44b42e2a925eff674a8',
            salt: '9cf8779f83532d34ecca8184c921f0198ea20a428e5734feb67464bc11f4807d',
            admin: true,
          },
        ]),
      },
    })
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

  override get volumes() {
    return super.volumes.concat([{
      name: 'config',
      configMap: {
        name: this.config.name,
      },
    }])
  }

  override get volume_mounts() {
    return super.volume_mounts.concat([{
      name: this.volumes[0].name,
      mountPath: '/homebridge/config.json',
      subPath: 'config.json',
    }, {
      name: this.volumes[0].name,
      mountPath: '/homebridge/auth.json',
      subPath: 'auth.json',
    }])
  }

  override get index() {
    return [
      this.service,
    ]
  }

}
