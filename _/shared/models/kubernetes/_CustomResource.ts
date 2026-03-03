import { CustomResource } from '@pulumi/kubernetes/apiextensions'
import { merge } from 'lodash'

export class _CustomResource extends CustomResource {

  constructor(
    name: string,
    args: any,
    opts?: any,
  ) {
    super(
      name,
      merge({
        metadata: {
          name,
        },
      }, args),
      opts,
    )
  }
}
