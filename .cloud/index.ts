import { Deployment } from '@pulumi/kubernetes/apps/v1';

const appLabels = { app: 'nginx' };
const deployment = new Deployment('nginx', {
  spec: {
    selector: { matchLabels: appLabels },
    replicas: 1,
    template: {
      metadata: { labels: appLabels },
      spec: { containers: [{ name: 'nginx', image: 'nginx' }] },
    },
  },
});
export const name = deployment.metadata.name;
