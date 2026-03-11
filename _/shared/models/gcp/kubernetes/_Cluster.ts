import { Provider } from '@pulumi/kubernetes'
import * as YAML from 'yaml'
import { once } from '../../../decorators'
import { _Cluster } from '../../kubernetes'

export class _GKE extends _Cluster {

  @once
  get provider() {
    return new Provider(this.host, {
      suppressHelmHookWarnings: true,
      enableConfigMapMutable: true,
      kubeconfig: all([
        this.endpoint,
        this.masterAuth,
      ]).apply(([
        endpoint,
        masterAuth,
      ]) => {
        const context = `${this.project}_${this.location}_${this.host}`
        return YAML.stringify({
          'apiVersion': 'v1',
          'clusters': [{
            name: context,
            cluster: {
              'certificate-authority-data': masterAuth.clusterCaCertificate,
              'server': `https://${endpoint}`,
            },
          }],
          'contexts': [{
            name: context,
            context: {
              cluster: context,
              user: context,
            },
          }],
          'current-context': context,
          'kind': 'Config',
          'preferences': {},
          'users': [{
            name: context,
            user: {
              exec: {
                apiVersion: 'client.authentication.k8s.io/v1beta1',
                provideClusterInfo: true,
                command: 'gke-gcloud-auth-plugin',
                installHint: `Install gke-gcloud-auth-plugin for use with kubectl by following
                  https://cloud.google.com/blog/products/containers-kubernetes/kubectl-auth-changes-in-gke`,
              },
            },
          }],
        })
      }),
    }, {
      dependsOn: this,
      parent: this,
    })
  }
}
