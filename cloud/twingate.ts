import { Config, CustomResourceOptions } from '@pulumi/pulumi';
import { TwingateConnector, TwingateConnectorTokens, TwingateRemoteNetwork, TwingateResource, TwingateResourceArgs } from '@twingate/pulumi-twingate';
import { merge } from 'lodash';

interface JGWTwingateResourceArgs extends Omit<TwingateResourceArgs,
  | 'remoteNetworkId'
  | 'protocols'
  | 'name'
  | ''> {
  ports?: string[]
  protocols?: any
}

export class Twingate extends TwingateResource {
  static config: any = new Config('twingate');
  static network = this.config.get('network');

  static remote = new TwingateRemoteNetwork('main', {
    location: 'ON_PREMISE',
    name: 'local',
  });

  static connector = new TwingateConnector('main', {
    remoteNetworkId: this.remote.id,
    name: 'main',
  });

  static tokens = new TwingateConnectorTokens('main', {
    connectorId: this.connector.id,
  });

  constructor(
    public $name: string,
    args: JGWTwingateResourceArgs,
    opts?: CustomResourceOptions,
    defaults: TwingateResourceArgs | any = {
      remoteNetworkId: Twingate.remote.id,
      isBrowserShortcutEnabled: false,
      name: args.address,
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
