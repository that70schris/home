import { IngressController } from '@pulumi/kubernetes-ingress-nginx'
import { Namespace, Secret, Service, ServiceSpecType } from '@pulumi/kubernetes/core/v1'
import { Chart } from '@pulumi/kubernetes/helm/v4'
import { Config, ResourceOptions } from '@pulumi/pulumi'
import { _CustomResource, _Ingress, _Kube } from '.'
import { once } from '../../decorators'
import { Twingate } from '../twingate'
import { _TwingateResource } from '../twingate/resource'

interface ClusterArgs {
  host: string
  kubes: _Kube[]
}

export class _Cluster {

  constructor(
    public name: string,
    public args: ClusterArgs,
    public opts?: ResourceOptions,
  ) {
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
      import: 'default',
    })

    this.index
    args.kubes.forEach((kube) => {
      kube.index?.forEach((resource) => {
        switch (resource.constructor) {
          case Service:
            new _TwingateResource(kube.name, {
              address: `${kube.name}.${kube.metadata.namespace ?? 'default'}.svc.cluster.local`,
            }, {
              dependsOn: resource,
              parent: resource,
            })
            break
        }
      })

      return kube.index
    })
  }

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
      service: {
        type: ServiceSpecType.NodePort,
        nodePorts: {
          http: '30080',
          https: '30443',
        },
      },
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
            ?? this.args.host,
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
        // gateway: {
        //   enabled: true,
        //   twingate: {
        //     network: Twingate.remote.id,
        //     resource: {
        //       enabled: true,
        //       extraAnnotations: {
        //         'resource.twingate.com/name': `_${this.name}`,
        //         'resource.twingate.com/alias': this.args.host,
        //       },
        //     },
        //   },
        // },
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

  @once
  get index() {
    return [
      this.ingress,
      this.twingate_operator,
      this.twingate_connector,
      // ...new mDNS().index,
    ]
  }

}
