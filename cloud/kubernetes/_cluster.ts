import { IngressController } from '@pulumi/kubernetes-ingress-nginx';
import { CustomResource } from '@pulumi/kubernetes/apiextensions';
import { Secret } from '@pulumi/kubernetes/core/v1';
import { Chart } from '@pulumi/kubernetes/helm/v4';
import { Config } from '@pulumi/pulumi';
import { once } from '../../shared/decorators/once';
import { Twingate } from '../twingate';
import { _Ingress } from './_Ingress';
import { _Kube } from './kubes';

interface ClusterArgs {
  domain?: string
  includes: _Kube[]
}

export class _Cluster {

  constructor(
    public name: string,
    public args: ClusterArgs,
  ) {

  }

  twingate = new Chart('twingate', {
    chart: 'connector',
    repositoryOpts: {
      repo: 'https://twingate.github.io/helm-charts',
    },
    values: {
      connector: {
        network: Twingate.network,
        accessToken: Twingate.tokens.accessToken,
        refreshToken: Twingate.tokens.refreshToken,
      },
    },
  });

  manager = new Chart('manager', {
    chart: 'cert-manager',
    repositoryOpts: {
      repo: 'https://charts.jetstack.io',
    },
    values: {
      global: {
        leaderElection: {
          namespace: 'default',
        },
      },
      installCRDs: true,
      prometheus: {
        enabled: false,
      },
    },
  });

  cloudflare = new Secret('cloudflare', {
    metadata: {
      name: 'cloudflare',
    },
    stringData: {
      token: new Config('cloudflare').require('apiToken'),
    },
  });

  issuer = new CustomResource('issuer', {
    apiVersion: 'cert-manager.io/v1',
    kind: 'Issuer',
    metadata: {
      name: 'issuer',
    },
    spec: {
      acme: {
        server: 'https://acme-staging-v02.api.letsencrypt.org/directory',
        email: 'chris@bailey.mx',
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
  });

  nginx = new IngressController('nginx', {
    fullnameOverride: 'nginx',
    controller: {
      publishService: {
        enabled: true,
      },
    },
  });

  @once
  get ingress() {
    return new _Ingress(this.name, {
      rules: this.args.includes
        .map(service => ({
          host: [
            service.name,
            this.args.domain,
          ].filter(Boolean).join('.'),
          http: {
            paths: [{
              backend: service.backend,
              pathType: 'Prefix',
              path: '/',
            }],
          },
        })),
    }, {
      issuer: this.issuer,
      controller: this.nginx,
      dependsOn: [
        this.nginx,
      ],
    });
  }

}
