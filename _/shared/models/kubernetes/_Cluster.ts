import { IngressController } from '@pulumi/kubernetes-ingress-nginx'
import { Secret } from '@pulumi/kubernetes/core/v1'
import { Chart } from '@pulumi/kubernetes/helm/v4'
import { Config, ResourceOptions } from '@pulumi/pulumi'
import { _CustomResource, _Ingress, _Kube } from '.'
import { once } from '../../decorators'
import { _TwingateResource } from '../twingate'
import { mDNS } from './kubes/mDNS'

interface ClusterArgs {
  domain?: string
  kubes: _Kube[]
}

export class _Cluster {

  constructor(
    public host: string,
    public args: ClusterArgs,
    public opts?: ResourceOptions,
  ) {
    // new _TwingateResource(this.host, {
    //   address: this.host,
    // })

    args.kubes.forEach((kube) => {
      return kube.index
    })

  }

  twingate = new Chart('twingate', {
    chart: 'connector',
    repositoryOpts: {
      repo: 'https://twingate.github.io/helm-charts',
    },
    values: {
      connector: {
        network: _TwingateResource.network,
        accessToken: _TwingateResource.tokens.accessToken,
        refreshToken: _TwingateResource.tokens.refreshToken,
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
  get mDNS() {
    return new mDNS().index
  }

  @once
  get index() {
    return [
      this.ingress,
      ...this.mDNS,
    ]
  }

}
