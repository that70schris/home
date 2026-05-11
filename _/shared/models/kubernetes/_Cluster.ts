import { IngressController } from '@pulumi/kubernetes-ingress-nginx'
import { Secret } from '@pulumi/kubernetes/core/v1'
import { Chart } from '@pulumi/kubernetes/helm/v4'
import { Config, ResourceOptions } from '@pulumi/pulumi'
import { _CustomResource, _Ingress, _Kube } from '.'
import { once } from '../../decorators'
import { _TwingateResource } from '../twingate'

interface ClusterArgs {
  domain?: string
  kubes: _Kube[]
  ip?: string
}

export class _Cluster {

  constructor(
    public name: string,
    public args: ClusterArgs,
    public opts?: ResourceOptions,
  ) {

    // new _TwingateKubernetesResource(`cluster:${name}`, {
    //   address: args.ip ?? `${this.name}.${args.domain}`,
    //   // alias: `${this.name}.${args.domain}`,
    //   tcp: [
    //     22,
    //     6443,
    //   ],
    // }, {
    //   // parent:
    // })

    args.kubes.forEach((kube) => {
      return kube.index
    })

  }

  // twingate_connector = new Chart('twingate-connector', {
  //   chart: 'connector',
  //   repositoryOpts: {
  //     repo: 'https://twingate.github.io/helm-charts',
  //   },
  //   values: {
  //     connector: {
  //       network: _TwingateResource.network,
  //       accessToken: _TwingateResource.tokens.accessToken,
  //       refreshToken: _TwingateResource.tokens.refreshToken,
  //     },
  //   },
  // })

  // twingate_gatway = new Chart('twingate-gateway', {
  //   chart: 'oci://ghcr.io/twingate/helmcharts/gateway',
  //   values: {
  //     twingate: {
  //       network: _TwingateResource.network,
  //     },
  //     tls: {
  //       dnsNames: [
  //         '195.168.0.5',
  //         'berry.local',
  //         'berry',
  //       ],
  //     },
  //   },
  // })

  twingate = new Chart('twingate', {
    chart: 'oci://ghcr.io/twingate/helmcharts/twingate-operator',
    values: {
      twingateOperator: {
        remoteNetworkId: _TwingateResource.remote.id,
        apiKey: _TwingateResource.config.get('apiToken'),
        network: _TwingateResource.network,
      },
      gateway: {
        enabled: true,
        twingate: {
          network: _TwingateResource.remote.id,
          resource: {
            enabled: true,
            extraAnnotations: {
              'resource.twingate.com/address': '192.168.0.5',
              'resource.twingate.com/alias': 'berry.local',
              'resource.twingate.com/name': 'Kuberries',
            },
          },
        },
      },
    },
  })

  twingate_connector = new _CustomResource('twingate:connector', {
    apiVersion: 'twingate.com/v1beta',
    kind: 'TwingateConnector',
    metadata: {
      name: 'main',
    },
    spec: {
      name: 'main',
      imagePolicy: {
        schedule: '0 0 * * *',
      },
    },
  }, {
    dependsOn: this.twingate,
    parent: this.twingate,
  })

  twingate_role_binding = new _CustomResource('twingate:role-binding', {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'ClusterRoleBinding',
    metadata: {
      name: 'kuberries',
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'edit',
    },
    subjects: [{
      kind: 'Group',
      name: 'Chris Bailey',
      apiGroup: 'rbac.authorization.k8s.io',
    }],
  })

  twingate_resource_access = new _CustomResource('twingate:resource-access', {
    apiVersion: 'twingate.com/v1beta',
    kind: 'TwingateResourceAccess',
    metadata: {
      name: 'kuberries',
    },
    spec: {
      resourceRef: {
        name: 'Kuberries',
      },
      principalExternalRef: {
        name: 'Chris Bailey',
        type: 'group',
      },
    },
  })

  manager = new Chart('manager', {
    chart: 'cert-manager',
    repositoryOpts: {
      repo: 'https://charts.jetstack.io',
    },
    values: {
      fullnameOverride: 'certificate',
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

  cloudflare = new Secret('cloudflare', {
    metadata: {
      name: 'cloudflare',
    },
    stringData: {
      token: new Config('cloudflare')
        .require('apiToken'),
    },
  })

  root = new _CustomResource('root', {
    apiVersion: 'cert-manager.io/v1',
    kind: 'ClusterIssuer',
    spec: {
      selfSigned: {},
    },
  })

  cert = new _CustomResource('root', {
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
      this.root,
    ],
  })

  private = new _CustomResource('private', {
    apiVersion: 'cert-manager.io/v1',
    kind: 'ClusterIssuer',
    spec: {
      ca: {
        secretName: this.cert.metadata.name,
      },
    },
  }, {
    dependsOn: [
      this.cert,
    ],
  })

  letsencrypt = new _CustomResource('letsencrypt', {
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
      this.cloudflare,
      this.manager,
    ],
  })

  nginx = new IngressController('nginx', {
    fullnameOverride: 'nginx',
    controller: {
      containerName: 'main',
    },
  })

  @once
  get ingress() {
    return new _Ingress('nginx', {
      rules: this.args?.kubes
        .filter((kube) => {
          return kube.ingress
        }).map(kube => ({
          host: [
            kube.name,
            kube.overrides.domain
            ?? this.args.domain,
          ].filter(Boolean).join('.'),
          http: {
            paths: [{
              backend: kube.backend,
              pathType: 'Prefix',
              path: '/',
            }],
          },
        })),
    }, {
      cluster: this,
      issuer: this.letsencrypt,
    })
  }

  @once
  get index() {
    return [
      this.ingress,
      // ...new mDNS().index,
    ]
  }

}
