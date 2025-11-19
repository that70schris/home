// import { Plex } from './plex';

import { Chart } from '@pulumi/kubernetes/helm/v4';
import { Twingate } from './twingate';
// new Plex().deployment;

new Chart('twingate', {
  repositoryOpts: {
    repo: 'https://twingate.github.io/helm-charts',
  },
  chart: 'connector',
  values: {
    connector: {
      network: Twingate.network.name,
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
