import { DnsRecord, DnsRecordArgs, RecordArgs } from '@pulumi/cloudflare'
import { CustomResourceOptions, Input } from '@pulumi/pulumi'
import { merge } from 'lodash'
import { _Config } from '../..'

interface _RecordArgs extends Omit<DnsRecordArgs,
  | 'zoneId'
  | 'name'
  | 'type'
  | 'ttl'
  | ''> {
  apex?: boolean
  name?: Input<string>
  type?: Input<string>
  zone: string
}

export class _Record extends DnsRecord {

  constructor(
    public $name: string,
    args: _RecordArgs,
    opts?: CustomResourceOptions,
    defaults: RecordArgs = {
      name: args.apex ? '@' : $name,
      zoneId: Object.entries(
        new _Config('cloudflare').object?.zones,
      ).find(([ key, value ]) => {
        return RegExp(key).test(args.zone ?? $name)
      })?.[1] as string,
      type: 'A',
      ttl: 1,
    },
  ) {
    super(
      $name,
      merge(defaults, args),
      {
        ...opts,
        deleteBeforeReplace: true,
      },
    )
  }

}
