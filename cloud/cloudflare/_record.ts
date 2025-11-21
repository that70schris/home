import { DnsRecord, DnsRecordArgs, RecordArgs } from '@pulumi/cloudflare';
import { CustomResourceOptions, Input } from '@pulumi/pulumi';
import { merge } from 'lodash';
import { _Config } from '../_config';

interface _RecordArgs extends Omit<DnsRecordArgs,
  | 'zoneId'
  | 'name'
  | 'type'
  | 'ttl'
  | ''> {
  domain: string
  name?: Input<string>
  type?: Input<string>
}

export class _Record extends DnsRecord {

  constructor(
    public $name: string,
    args: _RecordArgs,
    opts?: CustomResourceOptions,
    defaults: RecordArgs = {
      zoneId: new _Config('cloudflare').object?.zones[args.domain],
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
