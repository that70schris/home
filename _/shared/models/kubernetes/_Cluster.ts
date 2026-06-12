import { Secret } from '@pulumi/kubernetes/core/v1'
import { Chart } from '@pulumi/kubernetes/helm/v4'
import { ConfigFile } from '@pulumi/kubernetes/yaml'
import { Config, ResourceOptions } from '@pulumi/pulumi'
import { _CustomResource, _Kube } from '.'
import { twingate } from '../../../home.lab'
import { once } from '../../decorators'
import { _Record } from '../cloudflare'
import { Twingate } from '../twingate'
import { _TwingateResource } from '../twingate/resource'

interface ClusterArgs {
  domain?: string
  host: string
  ip: string
  kubes: _Kube[]
}

export class _Cluster {

  constructor(
    public name: string,
    public args: ClusterArgs,
    public opts?: ResourceOptions,
  ) {
    this.twingate_connector
    this.gateway_definitions
    this.certificate
    this.metallb
    this.pool
    this.nginx
    this.gateway
    this.routes
  }

  @once
  get manager() {
    return new Chart('manager', {
      chart: 'cert-manager',
      repositoryOpts: {
        repo: 'https://charts.jetstack.io',
      },
      values: {
        fullnameOverride: 'certificate',
        config: {
          kind: 'ControllerConfiguration',
          enableGatewayAPI: true,
        },
        crds: {
          enabled: true,
          keep: false,
        },
        global: {
          leaderElection: {
            namespace: 'default',
          },
        },
      },
    })
  }

  @once
  get cloudflare() {
    return new Secret('cloudflare', {
      metadata: {
        name: 'cloudflare',
      },
      stringData: {
        token: new Config('cloudflare')
          .require('apiToken'),
      },
    })
  }

  @once
  get root() {
    return new _CustomResource('root', {
      apiVersion: 'cert-manager.io/v1',
      kind: 'ClusterIssuer',
      spec: {
        selfSigned: {},
      },
    })
  }

  @once
  get certificate() {
    return new _CustomResource('root', {
      apiVersion: 'cert-manager.io/v1',
      kind: 'Certificate',
      spec: {
        isCA: true,
        commonName: 'bailey.mx',
        secretName: this.root.metadata.name,
        privateKey: {
          algorithm: 'ECDSA',
          size: 256,
        },
        issuerRef: {
          kind: this.root.kind,
          name: this.root.metadata.name,
        },
      },
    }, {
      dependsOn: [
        this.cloudflare,
        this.manager,
      ],
    })
  }

  @once
  get private() {
    return new _CustomResource('private', {
      apiVersion: 'cert-manager.io/v1',
      kind: 'ClusterIssuer',
      spec: {
        ca: {
          secretName: this.certificate.metadata.name,
        },
      },
    })
  }

  @once
  get letsencrypt() {
    return new _CustomResource('letsencrypt', {
      apiVersion: 'cert-manager.io/v1',
      kind: 'ClusterIssuer',
      spec: {
        acme: {
          server: 'https://acme-v02.api.letsencrypt.org/directory',
          email: new Config().require('email'),
          privateKeySecretRef: {
            name: 'letsencrypt',
          },
          solvers: [{
            dns01: {
              cloudflare: {
                apiTokenSecretRef: {
                  name: this.cloudflare.metadata.name,
                  key: 'token',
                },
              },
            },
          }],
        },
      },
    }, {
      deleteBeforeReplace: true,
      dependsOn: [
        this.manager,
      ],
    })
  }

  @once
  get metallb() {
    return new Chart('metallb', {
      chart: 'metallb',
      repositoryOpts: {
        repo: 'https://metallb.github.io/metallb',
      },
      values: {

      },
    }, {
      dependsOn: [
        this.certificate,
      ],
    })
  }

  @once
  get pool() {
    return new _CustomResource('pool', {
      apiVersion: 'metallb.io/v1beta1',
      kind: 'IPAddressPool',
      metadata: {
        name: 'lab-pool',
      },
      spec: {
        addresses: [
          `${this.args.ip}/32`,
        ],
      },
    }, {
      dependsOn: [
        this.metallb,
      ],
    })
  }

  @once
  get gateway_definitions() {
    return new ConfigFile('gateway-definitions', {
      file: 'https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.3.0/standard-install.yaml',
    })
  }

  @once
  get nginx() {
    const agent = new _CustomResource('agent-tls', {
      apiVersion: 'cert-manager.io/v1',
      kind: 'Certificate',
      metadata: {
        name: 'agent-tls',
      },
      spec: {
        secretName: 'agent-tls',
        dnsNames: [
          '*.cluster.local',
        ],
        issuerRef: {
          kind: this.private.kind,
          name: this.private.metadata.name,
        },
      },

    })

    const server = new _CustomResource('server-tls', {
      apiVersion: 'cert-manager.io/v1',
      kind: 'Certificate',
      metadata: {
        name: 'server-tls',
      },
      spec: {
        secretName: 'server-tls',
        dnsNames: [
          'ngf-nginx-gateway-fabric.default.svc',
        ],
        issuerRef: {
          kind: this.private.kind,
          name: this.private.metadata.name,
        },
      },
    })

    return new Chart('ngf', {
      chart: 'oci://ghcr.io/nginx/charts/nginx-gateway-fabric',
      values: {

      },
    }, {
      dependsOn: [
        this.gateway_definitions,
        this.metallb,
        server,
        agent,
      ],
    })
  }

  @once
  get gateway() {
    return new _CustomResource('gateway', {
      apiVersion: 'gateway.networking.k8s.io/v1',
      kind: 'Gateway',
      metadata: {
        name: 'nginx',
        annotations: {
          'cert-manager.io/cluster-issuer':
            this.letsencrypt.metadata.name,
        },
      },
      spec: {
        gatewayClassName: 'nginx',
        listeners: this.args?.kubes.map((kube) => {
          return {
            name: kube.name,
            port: kube.spec.https ? 443 : 80,
            protocol: kube.spec.https ? 'HTTPS' : 'HTTP',
            hostname: [
              kube.name,
              kube.spec.domain ?? this.args.domain ?? this.args.host,
            ].filter(Boolean).join('.'),
            tls: kube.spec.https ? {
              mode: 'Terminate',
              certificateRefs: [{
                kind: 'Secret',
                name: kube.name,
              }],
            } : undefined,
          }
        }),

      },
    }, {
      dependsOn: [
        this.nginx,
      ],
    })
  }

  @once
  get routes() {
    return this.args?.kubes
      .filter((kube) => {
        return kube.spec.gateway
      }).map((kube) => {
        const hostname = [
          kube.name,
          kube.spec.domain ?? this.args.domain ?? this.args.host,
        ].filter(Boolean).join('.')

        new _Record(hostname, {
          domain: hostname,
          content: this.args.ip,
          // proxied: kube.proxied,
        })

        new _TwingateResource(hostname, {
          gate: twingate,
          isBrowserShortcutEnabled: true,
          tcp: [
            kube.spec.https ? 443 : 80,
          ].concat(kube.spec.hostNetwork
            && kube.spec.container_port
            || []),
        })

        return new _CustomResource(`${kube.name}-route`, {
          apiVersion: 'gateway.networking.k8s.io/v1',
          kind: 'HTTPRoute',
          metadata: {
            name: kube.name,
          },
          spec: {
            parentRefs: [{
              name: this.gateway.metadata.name,
              sectionName: kube.spec.https ? kube.name : 'http',
            }],
            hostnames: [
              hostname,
            ],
            rules: [{
              matches: [{
                path: {
                  type: 'PathPrefix',
                  value: kube.spec.path,
                },
              }],
              backendRefs: [
                kube.backend,
              ],
            }],
          },
        })
      })

  }

  @once
  get twingate_operator() {
    return new Chart('twingate', {
      chart: 'oci://ghcr.io/twingate/helmcharts/twingate-operator',
      values: {
        nameOverride: 'operator',
        twingateOperator: {
          remoteNetworkId: twingate.remote.id,
          apiKey: Twingate.config.get('apiToken'),
          network: Twingate.network,
        },
      },
    })
  }

  @once
  get twingate_connector() {
    return new _CustomResource(
      'twingate-connector', {
        apiVersion: 'twingate.com/v1beta',
        kind: 'TwingateConnector',
        spec: {
          name: 'main',
          imagePolicy: {
            schedule: '0 0 * * *',
          },
        },
      }, {
        dependsOn: this.twingate_operator,
        parent: this.twingate_operator,
      },
    )
  }

}
