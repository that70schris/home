import { CustomResource } from '@pulumi/kubernetes/apiextensions';
import { Chart } from '@pulumi/kubernetes/helm/v4';
import { Twingate } from '../../twingate';
import { Kube } from '../kubes';

export class Cluster {
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

  includes: Kube[] = [

  ];
}
