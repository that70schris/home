import { Config, CustomResourceOptions } from '@pulumi/pulumi';
import { TwingateConnector, TwingateConnectorTokens, TwingateRemoteNetwork, TwingateResource, TwingateResourceArgs } from '@twingate/pulumi-twingate';
import { merge } from 'lodash';

interface _TwingateResourceArgs extends Omit<TwingateResourceArgs,
  | 'remoteNetworkId'
  | 'protocols'
  | 'name'
  | ''> {
  ports?: string[]
  protocols?: any
}

export class Twingate extends TwingateResource {
  static config: any = new Config('twingate');
  static network = Twingate.config.get('network');

  static remote = new TwingateRemoteNetwork('main', {
    location: 'ON_PREMISE',
    name: 'local',
  });

  static connector = new TwingateConnector('main', {
    remoteNetworkId: Twingate.remote.id,
    name: 'main',
  });

  static tokens = new TwingateConnectorTokens('main', {
    connectorId: Twingate.connector.id,
  });

  static groups = {
    everyone: { groupId: 'R3JvdXA6Mjg1NTA4' },
  };

  constructor(
    public $name: string,
    args: _TwingateResourceArgs,
    opts?: CustomResourceOptions,
    defaults: TwingateResourceArgs = {
      remoteNetworkId: Twingate.remote.id,
      isBrowserShortcutEnabled: false,
      address: args.address,
      name: args.address,
      accessGroups: [
        Twingate.groups.everyone,
      ],
      protocols: {
        allowIcmp: false,
        tcp: {
          policy: 'RESTRICTED',
          ports: args.ports,
        },
        udp: {
          policy: 'DENY_ALL',
        },
      },
    },
  ) {
    super(
      $name,
      merge(defaults, args),
      merge({
        parent: Twingate.connector,
      }, opts),
    );
  }
}
