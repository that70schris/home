import { Ingress, IngressArgs } from '@pulumi/kubernetes/networking/v1';
import { input } from '@pulumi/kubernetes/types';
import { CustomResourceOptions, Input, interpolate } from '@pulumi/pulumi';
import { merge } from 'lodash';

import { CustomResource } from '@pulumi/kubernetes/apiextensions';
import { Twingate } from './twingate';

interface _IngressArgs extends IngressArgs {
  rules: input.networking.v1.IngressRule[]
  zoneId?: Input<string>
  internal?: boolean
  twingate?: boolean
  proxied?: boolean
}

interface IngressResourceOptions extends CustomResourceOptions {
  issuer: CustomResource
}

export class _Ingress extends Ingress {
  constructor(
    public $name: string,
    private args: _IngressArgs,
    opts: IngressResourceOptions,
  ) {
    super(
      $name,
      merge({
        metadata: {
          name: $name,
          annotations: {
            'cert-manager.io/issuer': opts.issuer.metadata.name,
          },
        },
        spec: {
          rules: args.rules,
          tls: [{
            secretName: new CustomResource($name, {
              apiVersion: 'cert-manager.io/v1',
              kind: 'Certificate',
              metadata: {
                name: $name,
              },
              spec: {
                secretName: $name,
                dnsNames: args.rules.map(rule => rule.host),
                issuerRef: {
                  name: opts.issuer.metadata.name,
                },
              },
            }, {
              dependsOn: opts.issuer,
              parent: opts.issuer,
            }).metadata.name,
            hosts: args.rules.map(rule => rule.host),
          }],
        },
      } as IngressArgs, args),
      opts,
    );

    args.rules.forEach((rule) => {
      interpolate`${rule.host}`.apply((host) => {
        // new _Record(host, {
        //   name: rule.host,
        //   zoneId: args.zoneId,
        //   content: address.address,
        //   proxied: args.proxied,
        // }, {
        //   parent: this,
        // });

        new Twingate(host, {
          address: host,
          isBrowserShortcutEnabled: true,
          ports: [
            '443',
          ],
        }, {
          parent: this,
        });
      });
    });
  }
}
