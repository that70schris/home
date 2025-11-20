import { Plex } from './plex';

import { CustomResource } from '@pulumi/kubernetes/apiextensions';
import { Chart } from '@pulumi/kubernetes/helm/v4';
import { _Ingress } from './ingress';
import { Twingate } from './twingate';

new Chart('twingate', {
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
    resources: {
      requests: {
        memory: '.5Gi',
        cpu: '.25',
      },
    },
  },
});

const manager = new Chart('manager', {
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

const issuer = new CustomResource('issuer', {
  apiVersion: 'cert-manager.io/v1',
  kind: 'Issuer',
  metadata: {
    name: 'issuer',
  },
  spec: {
    selfSigned: {},
  },
}, {
  dependsOn: manager,
});

new _Ingress('berry', {
  rules: [{
    host: 'berry',
    http: {
      paths: [
        new Plex(),
      ].map((service) => {
        service.service;

        return {
          path: `/${service.name}`,
          pathType: 'Prefix',
          backend: service.backend,
        };
      }),
    },
  }],
}, {
  issuer,
});
