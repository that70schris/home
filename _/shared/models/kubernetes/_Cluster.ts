import { Namespace, Secret } from '@pulumi/kubernetes/core/v1'
import { Chart } from '@pulumi/kubernetes/helm/v4'
import { ConfigFile } from '@pulumi/kubernetes/yaml'
import { Config, ResourceOptions } from '@pulumi/pulumi'
import { _CustomResource, _Kube } from '.'
import { once } from '../../decorators'
import { Twingate } from '../twingate'

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
    // for Talos Linux
    new Namespace('default', {
      metadata: {
        name: 'default',
        labels: {
          'pod-security.kubernetes.io/enforce': 'privileged',
          'pod-security.kubernetes.io/audit': 'restricted',
          'pod-security.kubernetes.io/warn': 'baseline',
        },
      },
    }, {
      retainOnDelete: true,
      import: 'default',
    })

    this.gateway_definitions
    this.certificate
    this.nginx
    // this.gateway
    // this.twingate_connector
    // ...new mDNS().index
  }

  @once
  get gateway_definitions() {
    return new ConfigFile('gateway-definitions', {
      file: 'https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.3.0/standard-install.yaml',
    })
  }

  @once
  get nginx() {
    new _CustomResource('agent-tls', {
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
          name: this.private.metadata.name,
        },
      },

    })

    new _CustomResource('server-tls', {
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
      ],
    })
  }

  @once
  get gateway() {
    return new _CustomResource('gateway', {
      apiVersion: 'gateway.networking.k8s.io/v1',
      kind: 'Gateway',
      spec: {
        gatewayClassName: 'nginx',
        listeners: [{
          name: 'http',
          port: 80,
          protocol: 'HTTP',
          allowedRoutes: {
            namespaces: {
              from: 'All',
            },
          },
        }],
      },
    }, {
      dependsOn: [
        this.certificate,
        this.gateway_definitions,
        this.nginx,
      ],
    })
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
  get twingate_operator() {
    return new Chart('twingate', {
      chart: 'oci://ghcr.io/twingate/helmcharts/twingate-operator',
      values: {
        nameOverride: 'operator',
        twingateOperator: {
          remoteNetworkId: Twingate.remote.id,
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
