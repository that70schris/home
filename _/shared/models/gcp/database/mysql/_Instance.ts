import * as mysql from '@pulumi/mysql'
import { merge } from 'lodash'

import { once } from 'shared/decorators'
import { _DatabaseInstanceArgs, _DatabaseInstanceResourceOptions } from './instance'

export class _MySQLInstance extends _DatabaseInstance {

  constructor(
    override $name: string,
    args: _DatabaseInstanceArgs = {},
    opts?: _DatabaseInstanceResourceOptions,
    defaults: _DatabaseInstanceArgs = {
      databaseVersion: 'MYSQL_8_0',
      adminName: 'root',
      port: 3306,
    },
  ) {
    super(
      $name,
      merge(defaults, args, {
        masterInstanceName: opts?.parent?.name,
      }),
      opts,
    )
  }

  @once
  override get provider() {
    return new mysql.Provider(this.$name, {
      username: this.admin.name,
      password: this.admin.password,
      endpoint: `${this.host}:${this.port}`,
    }, {
      dependsOn: this,
      parent: this,
    })
  }

}
