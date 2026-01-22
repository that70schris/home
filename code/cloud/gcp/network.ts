import { Address, Firewall, GlobalAddress, NetworkPeeringRoutesConfig, Router, RouterNat, Subnetwork } from '@pulumi/gcp/compute'
import { Connection } from '@pulumi/gcp/servicenetworking'
import { interpolate } from '@pulumi/pulumi'

import { _Config } from '../shared'
import { once } from '../shared/decorators'

export class Network {

  static connection = new Connection(_Config.network, {
    network: _Config.network,
    service: 'servicenetworking.googleapis.com',
    reservedPeeringRanges: [new GlobalAddress(_Config.network, {
      purpose: 'VPC_PEERING',
      addressType: 'INTERNAL',
      network: _Config.network,
      prefixLength: 16,
    }).name],
  })

  static peering = new NetworkPeeringRoutesConfig(_Config.network, {
    peering: this.connection.peering,
    network: _Config.network,
    importCustomRoutes: true,
    exportCustomRoutes: true,
  }, {
    parent: this.connection,
  })

  static router = new Router(_Config.network, {
    network: _Config.network,
  })

  static ips = [...Array(1).keys()].map((i) => {
    return new Address(`gateway${i}`)
  })

  static nat = new RouterNat(_Config.network, {
    router: interpolate`${this.router.name}`,
    sourceSubnetworkIpRangesToNat: 'ALL_SUBNETWORKS_ALL_PRIMARY_IP_RANGES',
    tcpEstablishedIdleTimeoutSec: 120,
    natIpAllocateOption: 'MANUAL_ONLY',
    minPortsPerVm: 4096,
    natIps: this.ips.map((gateway) => {
    // gateway.address.apply(console.log);
      return gateway.selfLink
    }),
    logConfig: {
      enable: true,
      filter: 'ALL',
    },
  }, {
    deleteBeforeReplace: true,
    parent: this.router,
  })

  @once
  static get proxy() {
    return new Subnetwork(_Config.network, {
      purpose: 'REGIONAL_MANAGED_PROXY',
      ipCidrRange: '10.1.0.0/24',
      network: _Config.network,
      role: 'ACTIVE',
    })
  }

  static firewall = new Firewall(_Config.network, {
    network: _Config.network,
    sourceRanges: [
      '0.0.0.0/0',
    ],
    allows: [{
      protocol: 'TCP',
    }],
  })

}
