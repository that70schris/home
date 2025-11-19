import { Address, GlobalAddress } from '@pulumi/gcp/compute';
import { CustomResource } from '@pulumi/kubernetes/apiextensions';
import { Ingress, IngressArgs } from '@pulumi/kubernetes/networking/v1';
import { CustomResourceOptions, Input } from '@pulumi/pulumi';
import { merge } from 'lodash';

import { Cato } from '../../resources/cato';
import { _Record } from './record';

interface IngressRule {
  host: string
  hosts?: string[]
}

interface _IngressArgs extends IngressArgs {
  rules: IngressRule[]
  zoneId?: Input<string>
  internal?: boolean
  twingate?: boolean
  proxied?: boolean
}

export class _Ingress extends Ingress {
  address: Address | GlobalAddress;

  constructor(
    public $name: string,
    private args: _IngressArgs,
    opts: CustomResourceOptions,
  ) {
    const address = args.internal
      ? new Address($name, {
          addressType: 'INTERNAL',
          subnetwork: Cato.subnet.id,
        }, {
          parent: opts.parent,
        })
      : new GlobalAddress($name, {

        }, {
          parent: opts.parent,
        });

    const config = !args.internal
      ? new CustomResource($name, {
          apiVersion: 'networking.gke.io/v1beta1',
          kind: 'FrontendConfig',
          metadata: {
            name: $name,
          },
          spec: {
            redirectToHttps: {
              enabled: true,
            },
          },
        }, opts)
      : null;

    super(
      $name,
      merge({
        metadata: {
          name: $name,
          annotations: {
            'kubernetes.io/ingress.allow-http': `${!args.internal}`,
            'kubernetes.io/ingress.class': args.internal ? 'gce-internal' : 'gce',
            [`kubernetes.io/ingress.${args.internal ? 'regional' : 'global'}-static-ip-name`]: address?.name,
            'networking.gke.io/v1beta1.FrontendConfig': config?.metadata.name,
            // 'cert-manager.io/issuer': opts.parent.issuer.metadata.name,
          },
        },
        spec: {
          rules: args.rules,
          tls: [{
            // secretName: opts.parent.wildcard.metadata.name,
            hosts: args.rules.map(rule => rule.host),
          }],
        },
      } as IngressArgs, args),
      merge(opts, {
        parent: opts.parent,
        dependsOn: [].concat(
          opts.dependsOn,
        ).concat(args.internal
          ? JGWNetwork.proxy
          : []),
      }),
    );

    this.address = address;
    args.rules.forEach((rule) => {
      new _Record(rule.host, {
        name: rule.host,
        zoneId: args.zoneId,
        content: address.address,
        proxied: args.proxied,
      }, {
        parent: this,
      });

      rule.hosts?.forEach((host) => {
        new _Record(host, {
          name: host,
          zoneId: args.zoneId,
          content: address.address,
          proxied: args.proxied,
        }, {
          parent: this,
          deleteBeforeReplace: true,
        });
      });
    });
  }
}
