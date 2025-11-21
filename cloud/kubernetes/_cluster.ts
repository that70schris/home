import { IngressController } from '@pulumi/kubernetes-ingress-nginx';
import { CustomResource } from '@pulumi/kubernetes/apiextensions';
import { Chart } from '@pulumi/kubernetes/helm/v4';
import { once } from '../../shared/decorators/once';
import { Twingate } from '../twingate';
import { _Ingress } from './ingress';
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
    repositoryOpts: {
      repo: 'https://twingate.github.io/helm-charts',
    },
    chart: 'connector',
    values: {
      connector: {
        network: Twingate.network,
        accessToken: Twingate.tokens.accessToken,
        refreshToken: Twingate.tokens.refreshToken,
      },
    },
  });

  manager = new Chart('manager', {
    repositoryOpts: {
      repo: 'https://charts.jetstack.io',
    },
    chart: 'cert-manager',
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
          http01: {
            ingress: {
              ingressClassName: 'nginx',
            },
          },
        }],
      },
    },
  }, {
    deleteBeforeReplace: true,
    dependsOn: this.manager,
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
      rules: [{
        host: [
          this.name,
          this.args.domain,
        ].filter(Boolean).join('.'),
        http: {
          paths: this.args.includes.map(service => ({
            path: `/${service.name}`,
            pathType: 'Prefix',
            backend: service.backend,
          })),
        },
      }],
    }, {
      issuer: this.issuer,
      dependsOn: [
        this.nginx,
      ],
    });
  }

}
