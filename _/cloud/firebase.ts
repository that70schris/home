import { AccountToken, PageRule } from '@pulumi/cloudflare'
import { HostingCustomDomain, HostingSite, Project } from '@pulumi/gcp/firebase'
import { Key } from '@pulumi/gcp/serviceaccount'
import { _Config } from '../shared'
import { _Record } from '../shared/models/cloudflare'
import { _ServiceAccount } from '../shared/models/gcp'

export class Firebase {

  static project = new Project('bailey')

  static agent = new _ServiceAccount(
    'firebase-adminsdk', {
      id: 'firebase-adminsdk-fbsvc',
      roles: [
        'firebase.sdkAdminServiceAgent',
        'iam.serviceAccountTokenCreator',
      ],
    },
  )

  static site = new HostingSite(
    'hostwriter_app', {
      siteId: 'hostwriter',
    },
  )

  static key = new Key(
    'github', {
      serviceAccountId: this.agent.accountId,
    },
  ).privateKey.apply((key) => {
    // console.log(atob(key))
  })

  static domain = new HostingCustomDomain(
    'hostwriter.app', {
      customDomain: 'hostwriter.app',
      siteId: this.site.siteId,
      waitDnsVerification: true,
    }, {
      deleteBeforeReplace: true,
    },
  )

  static text = new _Record(
    'firebase.hostwriter.app', {
      domain: 'hostwriter.app',
      type: 'TXT',
      content: 'hosting-site=hostwriter',
    },
  )

  static www = new PageRule(
    'www.hostwriter.app', {
      zoneId: _Config.zones['hostwriter.app'],
      target: 'www.hostwriter.app/*',
      actions: {
        forwardingUrl: {
          url: 'https://hostwriter.app/$1',
          statusCode: 301,
        },
      },
    },
  )

  static auth = new AccountToken('test', {
    name: 'Firebase Authentication',
    accountId: 'c380083c727f97bd24c6b600d267b4c3',
    policies: [

    ],
  })

  static records = [
    new _Record('hostwriter.app', {
      content: '199.36.158.100',
      proxied: true,
    }),
    new _Record('www.hostwriter.app', {
      content: '199.36.158.100',
      proxied: true,
    }),
  ]

}
