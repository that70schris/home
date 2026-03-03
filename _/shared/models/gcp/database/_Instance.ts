import { DatabaseInstance, DatabaseInstanceArgs } from '@pulumi/gcp/sql'
import { CustomResourceOptions, Output } from '@pulumi/pulumi'
import { merge } from 'lodash'

import { _Record } from 'cloudflare'
import { _Config } from 'shared'
import { once } from 'shared/decorators'
import { Twingate } from 'twingate'
import { DatabasePlaceholder, _Database } from './_Database'
import { _DatabaseUser } from './_User'

export interface _DatabaseInstanceArgs extends Omit<DatabaseInstanceArgs,
  | 'masterInstanceName'
  | 'databaseVersion'
  | ''> {
  masterInstanceName?: Output<string>
  databaseVersion?: string
  ips?: { [key: string]: string[] | string }
  replicas?: number
  subdomain?: string
  port?: number
  adminName?: string
  databases?: DatabasePlaceholder[]
  max_connections?: number
}

export interface _DatabaseInstanceResourceOptions extends Omit<CustomResourceOptions,
  | 'parent'
  | ''> {
  parent?: _DatabaseInstance
}

export class _DatabaseInstance extends DatabaseInstance {
  public replicas: _DatabaseInstance[]
  public max_connections?: number
  public databases: _Database[]
  public admin: _DatabaseUser
  public host: string
  public port: number

  constructor(
    public $name: string,
    args: _DatabaseInstanceArgs = {},
    opts?: _DatabaseInstanceResourceOptions,
    defaults: _DatabaseInstanceArgs = {
      masterInstanceName: opts?.parent?.name,
      deletionProtection: true,
      subdomain: `${$name}.db`,
      settings: {
        deletionProtectionEnabled: true,
        availabilityType: opts?.parent?.settings?.availabilityType,
        tier: opts?.parent?.settings?.tier ?? 'db-custom-1-4096',
        diskSize: opts?.parent?.settings?.diskSize,
        backupConfiguration: !opts?.parent
          ? {
              enabled: true,
              location: 'us',
            }
          : null,
        ipConfiguration: {
          privateNetwork: `projects/${_Config.project}/global/networks/${_Config.network}`,
          authorizedNetworks: Object.entries(merge({

          }, args.ips)).reduce((result, network) => {
            return result.concat(
              [].concat(network[1] ?? []).map((ip) => {
                return {
                  name: network[0],
                  value: ip,
                }
              }),
            )
          }, []),
        },
      },
    },
  ) {
    const _args = merge(defaults, args)
    super($name, _args as DatabaseInstanceArgs, opts)
    this.port = args.port

    this.max_connections = args.max_connections
    this.databases = opts?.parent?.databases
      ?? args.databases?.filter(placeholder => placeholder)
        .map((placeholder) => {
          return new _Database(
            placeholder.name,
            merge(placeholder.args, {
              instance: this,
            }),
            placeholder.opts,
          )
        })

    if (!opts?.parent) {
      this.host = `${_args.subdomain}.${_Config.host}`

      new _Record(this.host, {
        name: this.host,
        content: this.privateIpAddress,
      }, {
        parent: this,
      })

      new Twingate(`db/${this.$name}`, {
        address: this.host,
        accessGroups: [
          Twingate.groups.everyone,
        ],
        ports: [
          args.port,
        ],
      }, {
        parent: this,
      })

      this.admin = new _DatabaseUser(args.adminName, {
        password: this.config.admin?.password,
        instance: this,
      })
    }
  }

  @once
  get config() {
    return new _Config('db').object[this.$name]
  }

  @once
  get provider() {
    return null
  }

}
