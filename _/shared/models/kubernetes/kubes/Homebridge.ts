import { PersistentVolumeClaim } from '@pulumi/kubernetes/core/v1'
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
      service_port: 443,
      gateway: true,
      https: true,
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

  @once
  get homebridge() {
    return new PersistentVolumeClaim(this.name, {
      metadata: {
        name: this.name,
      },
      spec: {
        storageClassName: '',
        accessModes: [
          'ReadWriteOnce',
        ],
        resources: {
          requests: {
            storage: '10Gi',
          },
        },
      },
    })
  }

  override get volumes() {
    return super.volumes.concat([{
      name: 'config',
      configMap: {
        name: this.config.name,
      },
    // }, {
    //   name: this.homebridge.metadata.name,
    //   persistentVolumeClaim: {
    //     claimName: this.homebridge.metadata.name,
    //   },
    }])
  }

  override get volume_mounts() {
    return super.volume_mounts.concat([{
      name: 'config',
      mountPath: '/homebridge/config.json',
      subPath: 'config.json',
    }, {
      name: 'config',
      mountPath: '/homebridge/auth.json',
      subPath: 'auth.json',
    // }, {
    //   name: 'homebridge',
    //   mountPath: '/homebridge/',
    }])
  }

  override get index() {
    return [
      this.service,
    ]
  }

}

// node: berry.home.lab
// metadata:
//     namespace: runtime
//     type: Disks.block.talos.dev
//     id: nvme0n1
//     version: 2
//     owner: block.DisksController
//     phase: running
// spec:
//     dev_path: /dev/nvme0n1
//     size: 1000204886016
//     pretty_size: 1.0 TB
//     io_size: 512
//     sector_size: 512
//     readonly: false
//     cdrom: false
//     model: Samsung SSD 980 PRO with Heatsink 1TB
//     serial: S6WSNS0X103930J
//     wwid: eui.002538b14140164d
//     bus_path: /platform/axi/1000110000.pcie/pci0001:00/0001:00:00.0/0001:01:00.0/nvme
//     sub_system: /sys/class/block
//     transport: nvme
//     symlinks:
//         - /dev/disk/by-diskseq/29
//         - /dev/disk/by-id/nvme-Samsung_SSD_980_PRO_with_Heatsink_1TB_S6WSNS0X103930J
//         - /dev/disk/by-id/nvme-Samsung_SSD_980_PRO_with_Heatsink_1TB_S6WSNS0X103930J_1
//         - /dev/disk/by-id/nvme-eui.002538b14140164d
//         - /dev/disk/by-path/platform-1000110000.pcie-pci-0001:01:00.0-nvme-1
