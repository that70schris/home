import * as talos from '@pulumiverse/talos'
import { readFileSync, writeFileSync } from 'fs'
import { merge } from 'lodash'
import * as yaml from 'yaml'
import { once } from '../shared/decorators'
import { Twingate } from '../shared/models/twingate'
import { _TwingateResource } from '../shared/models/twingate/resource'

export class Talos {
  kubeVersion = 'v1.36.1'
  talosVersion = 'v1.13.3'

  constructor(
    public name: string,
    public host: string = `${name}.home.lab`,
  ) {
    this.bootstrap
    this.secrets.clientConfiguration.apply((config) => {
      try {
        const path = './.talos/config'
        const _config = yaml.parse(readFileSync(path, 'utf8'))
        _config.contexts.berry = merge(
          _config.contexts.berry, {
            ca: config.caCertificate,
            crt: config.clientCertificate,
            key: config.clientKey,
            endpoints: [
              this.endpoint,
            ],
          },
        )

        writeFileSync(
          path,
          yaml.stringify(_config),
        )
      } catch(err) {

      }
    })

    new _TwingateResource(host, {
      accessGroups: [
        Twingate.groups.admin,
      ],
      tcp: [
        6443,
      ],
    })
  }

  @once
  get secrets() {
    return new talos.machine.Secrets(this.name, {
      talosVersion: this.talosVersion,
    })
  }

  @once
  get endpoint() {
    return `${this.host}`
  }

  @once
  get config() {
    return talos.machine.getConfigurationOutput({
      clusterEndpoint: `https://${this.endpoint}:6443`,
      clusterName: this.name,
      machineType: 'controlplane',
      machineSecrets: this.secrets.machineSecrets,
      talosVersion: this.talosVersion,
    })
  }

  @once
  get apply() {
    return new talos.machine.ConfigurationApply(this.name, {
      clientConfiguration: this.secrets.clientConfiguration,
      machineConfigurationInput: this.config.machineConfiguration,
      node: this.host,
      timeouts: {
        create: '10s',
        update: '10s',
        delete: '10s',
      },
      configPatches: [
        {
          machine: {
            certSANs: [
              this.host,
              'kubernetes.default.svc.cluster.local',
              'kube.berry.home.lab',
              'berry.home.lab',
              'home.lab',
              'berry.local',
              'berry',
            ],
            features: {
              hostDNS: {
                enabled: true,
                forwardKubeDNSToHost: true,
              },
            },
            install: {
              // disk: '/dev/mmcblk0',
              disk: '/dev/nvme0n1',
            },
          },
          cluster: {
            allowSchedulingOnControlPlanes: true,
          },
        },
      ].map((asdf) => {
        return JSON.stringify(asdf)
      }),
    }, {
      dependsOn: [
        this.secrets,
      ],
    })
  }

  @once
  get bootstrap() {
    return new talos.machine.Bootstrap(this.name, {
      clientConfiguration: this.secrets.clientConfiguration,
      endpoint: this.host,
      node: this.host,
      timeouts: {
        create: '1m',
      },
    }, {
      dependsOn: [
        this.apply,
      ],
    })
  }
}
