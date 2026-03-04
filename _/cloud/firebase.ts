import { Ruleset } from '@pulumi/cloudflare'
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

  static www = new Ruleset(
    'www.hostwriter.app', {
      zoneId: _Config.zones['hostwriter.app'],
      name: 'redirect www',
      phase: 'http_request_dynamic_redirect',
      kind: 'zone',
      rules: [{
        action: 'redirect',
        expression: 'http.host contains "www."',
        actionParameters: {
          fromValue: {
            preserveQueryString: true,
            statusCode: 307,
            targetUrl: {
              expression: 'wildcard_replace(http.host, "www.*", "https://${1}")',
            },
          },
        },
      }],
    },
  )

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
