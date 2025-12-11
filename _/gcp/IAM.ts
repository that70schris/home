import { IAMCustomRole } from '@pulumi/gcp/projects'
import { _GroupAccount, _ServiceAccount } from '.'

export class IAM {

  static operator = new _ServiceAccount('operator', {
    roles: [
      'serviceusage.apiKeysAdmin',
      'serviceusage.serviceUsageConsumer',
    ],
  })

  static admins = new _GroupAccount('admins', {
    roles: [
      'iam.serviceAccountTokenCreator',
    ],
  })

  static engineering = new _GroupAccount('engineers', {
    roles: [
      'cloudsql.instanceUser',
      'compute.osLogin',
      'firebase.admin',
      'iam.serviceAccountUser',
      'iap.tunnelResourceAccessor',
      'pubsub.subscriber',
      'pubsub.publisher',
      'secretmanager.secretAccessor',
      'storage.objectAdmin',
      'viewer',
      new IAMCustomRole('developer', {
        roleId: 'developer',
        title: 'Developer',
        permissions: [
          'compute.instances.start',
          'compute.instances.stop',
          'container.jobs.create',
        ],
      }).name,
    ],
  })

  static product = new _GroupAccount('product', {
    roles: [
      'logging.viewer',
      'storage.objectViewer',
    ],
  })

  static application = new _ServiceAccount('application', {
    roles: [
      'bigquery.dataEditor',
      'cloudtasks.enqueuer',
      'datastore.user',
      'firebase.sdkAdminServiceAgent',
      'iam.workloadIdentityUser',
      'logging.logWriter',
      'monitoring.metricWriter',
      'monitoring.viewer',
      'pubsub.publisher',
      'pubsub.subscriber',
      'pubsub.viewer',
      'secretmanager.secretAccessor',
      'secretmanager.viewer',
      'storage.objectAdmin',
      new IAMCustomRole('application', {
        roleId: 'application',
        title: 'Application',
        permissions: [
          'storage.buckets.get',
          'storage.objects.get',
        ],
      }).name,
    ],
  })

  static deployment = new _ServiceAccount('deployment', {
    roles: [
      'artifactregistry.repoAdmin',
      'cloudkms.cryptoKeyDecrypter',
      'cloudsql.editor',
      'compute.viewer',
      'container.developer',
      'redis.admin',
      'secretmanager.secretAccessor',
      'secretmanager.viewer',
    ],
  })

  static datadog = new _ServiceAccount('datadog', {
    roles: [
      'monitoring.viewer',
      'cloudasset.viewer',
      'compute.viewer',
      'browser',
    ],
  })

}
