import { Record, RecordArgs } from '@pulumi/cloudflare';
import { CustomResourceOptions, Input } from '@pulumi/pulumi';
import { merge } from 'lodash';

interface JGWRecordArgs extends Omit<RecordArgs,
  'zoneId'
  | 'name'
  | 'type'
  | 'ttl'
  | ''> {
  zoneId?: Input<string>
  name?: Input<string>
  type?: Input<string>
}

export class _Record extends Record {
  constructor(
    public override name: string,
    args: JGWRecordArgs,
    opts?: CustomResourceOptions,
    defaults: RecordArgs = {
      zoneId: JGW.zoneId,
      name: `${name}.${JGW.host}`,
      type: 'A',
      ttl: 1,
    },
  ) {
    super(
      name,
      merge(defaults, args),
      opts,
    );
  }
}
