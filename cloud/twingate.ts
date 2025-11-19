import { CustomResourceOptions } from '@pulumi/pulumi';
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
  static network = new TwingateRemoteNetwork('main', {
    location: 'ON_PREMISE',
    name: 'local',
  });

  static connector = new TwingateConnector('main', {
    remoteNetworkId: this.network.id,
    name: 'main',
  });

  static tokens = new TwingateConnectorTokens('main', {
    connectorId: this.connector.id,
  });

  static groups = {
    everyone: 'R3JvdXA6NjQxMTQ=',
    engineers: 'R3JvdXA6NzA3Mzc=',
    operators: 'R3JvdXA6NzMxODY=',
    contractors: 'R3JvdXA6NzYzMzk=',
    qa: 'R3JvdXA6NzI3ODA=',
  };

  static services = {
    github: 'U2VydmljZUFjY291bnQ6MmRkOTFmMDctYTcyNi00ZWU1LTllMDgtNzEwZmM0ZGE4MzQ0',
  };

  constructor(
    public $name: string,
    args: JGWTwingateResourceArgs,
    opts?: CustomResourceOptions,
    defaults: TwingateResourceArgs | any = {
      remoteNetworkId: Twingate.network.id,
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
