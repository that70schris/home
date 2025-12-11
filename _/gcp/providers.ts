import { Provider } from '@pulumi/gcp'
import { IAM } from '.'

export class Providers {
  static operator = new Provider('operator', {
    impersonateServiceAccount: IAM.operator.email,
  })
}
