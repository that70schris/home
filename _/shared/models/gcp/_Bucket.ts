import { Bucket, BucketArgs } from '@pulumi/gcp/storage'
import { CustomResourceOptions } from '@pulumi/pulumi'
import { merge } from 'lodash'

interface _BucketArgs extends Omit<BucketArgs,
  | 'location'
  | 'project'
  | ''> {

}

export class _Bucket extends Bucket {

  constructor(
    name: string,
    args?: _BucketArgs,
    opts?: CustomResourceOptions,
  ) {
    super(name, merge({
      name: `_${name}`,
      location: 'US',
      cors: [{
        origins: ['https://*'],
        responseHeaders: ['*'],
        methods: [
          'GET',
          'PUT',
        ],
      }],
    }, args), opts)
  }
}
