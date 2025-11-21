import { DnsRecord, DnsRecordArgs, RecordArgs } from '@pulumi/cloudflare';
import { CustomResourceOptions, Input } from '@pulumi/pulumi';
import { merge } from 'lodash';
import { _Config } from '../_Config';

interface _RecordArgs extends Omit<DnsRecordArgs,
  | 'zoneId'
  | 'name'
  | 'type'
  | 'ttl'
  | ''> {
  name?: Input<string>
  type?: Input<string>
}

export class _Record extends DnsRecord {

  constructor(
    public $name: string,
    args: _RecordArgs,
    opts?: CustomResourceOptions,
    defaults: RecordArgs = {
      zoneId: Object.entries(
        new _Config('cloudflare').object?.zones,
      ).find(([ key, value ]) => {
        return RegExp(key).test($name);
      })?.[1] as string,
      name: $name,
      type: 'A',
      ttl: 1,
    },
  ) {
    super(
      $name,
      merge(defaults, args),
      opts,
    );
  }

}
