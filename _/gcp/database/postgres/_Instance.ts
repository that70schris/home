import * as postgres from '@pulumi/postgresql'
import { all } from '@pulumi/pulumi'
import { merge } from 'lodash'

import { _Config } from 'shared'
import { once } from 'shared/decorators'
import { Network } from '../../network'
import { _DatabaseInstance, _DatabaseInstanceArgs, _DatabaseInstanceResourceOptions } from '../_Instance'
import { _PostgresUser } from './_User'

export interface _PostgresInstanceArgs extends _DatabaseInstanceArgs {
  owners?: string[]
}

export class _PostgresInstance extends _DatabaseInstance {
  public owners: string[]

  constructor(
    override $name: string,
    args: _PostgresInstanceArgs = {},
    opts?: _DatabaseInstanceResourceOptions,
    defaults: _PostgresInstanceArgs = {
      databaseVersion: 'POSTGRES_14',
      adminName: 'postgres',
      port: 5432,
      settings: {
        insightsConfig: {
          queryInsightsEnabled: true,
        },
        tier: opts?.parent?.settings?.tier ?? 'db-custom-1-4096',
        databaseFlags: opts?.parent?.settings?.databaseFlags ?? [
          {
            name: 'cloudsql.enable_pglogical',
            value: 'on',
          },
          {
            name: 'cloudsql.iam_authentication',
            value: 'on',
          },
          {
            name: 'cloudsql.logical_decoding',
            value: 'on',
          },
          {
            name: 'max_replication_slots',
            value: '10',
          },
          {
            name: 'max_wal_senders',
            value: '10',
          },
          args.max_connections
            ? {
                name: 'max_connections',
                value: args.max_connections?.toString(),
              }
            : null,
        ].filter((flag) => {
          return flag
        }),
      },
    },
  ) {
    super(
      $name,
      merge(defaults, args),
      merge({
        dependsOn: Network.connection,
      }, opts),
    )

    if (this.admin) {
      const datadog_user = new _PostgresUser('datadog', {
        instance: this,
        password: new _Config('datadog').object.password,
        privileges: {
          schema: [
            'USAGE',
          ],
        },
      })

      new postgres.Extension('postgres:pg_stat_statements', {
        database: 'postgres',
        name: 'pg_stat_statements',
      }, {
        deleteBeforeReplace: true,
        provider: this.provider,
        dependsOn: this,
        parent: this,
      })

      this.databases.forEach((database) => {
        new postgres.Extension(`${database.$name}:pg_stat_statements`, {
          database: database.name,
          name: 'pg_stat_statements',
        }, {
          deleteBeforeReplace: true,
          provider: this.provider,
          dependsOn: database,
          parent: database,
        })

        const datadog_schema = new postgres.Schema(`${database.$name}:datadog`, {
          database: database.name,
          name: 'datadog',
        }, {
          deleteBeforeReplace: true,
          provider: this.provider,
          dependsOn: database,
          parent: database,
        })

        new postgres.Function(`${database.$name}:datadog:explain`, {
          database: database.name,
          name: 'explain_statement',
          schema: 'datadog',
          language: 'plpgsql',
          returns: 'SETOF json',
          securityDefiner: true,
          strict: true,
          args: [
            {
              name: 'l_query',
              type: 'text',
            },
            {
              mode: 'OUT',
              name: 'explain',
              type: 'json',
            },
          ],
          body: `
            DECLARE
            curs REFCURSOR;
            plan JSON;

            BEGIN
              OPEN curs FOR EXECUTE pg_catalog.concat('EXPLAIN (FORMAT JSON) ', l_query);
              FETCH curs INTO plan;
              CLOSE curs;
              RETURN QUERY SELECT plan;
            END;
          `,
        }, {
          deleteBeforeReplace: true,
          dependsOn: datadog_schema,
          provider: this.provider,
          parent: database,
        })

        all([
          datadog_user.name,
          datadog_schema.name,
        ]).apply(([ user, schema ]) => {
          new postgres.Grant(
            `${database.$name}:schema:${schema}:${user}`, {
              database: database.name,
              objectType: 'schema',
              schema: schema,
              role: user,
              privileges: [
                'USAGE',
              ],
            }, {
              deleteBeforeReplace: true,
              provider: this.provider,
              parent: database,
              dependsOn: [
                datadog_schema,
                datadog_user,
              ],
            },
          )
        })
      })
    }

    this.owners = args.owners
    this.replicas = [...Array(args.replicas ?? 0).keys()].map((i) => {
      return new _PostgresInstance(`${this.$name}${i}`, {
        max_connections: args.max_connections,
        settings: args.settings,
      }, {
        dependsOn: this,
        parent: this,
      })
    })
  }

  @once
  override get provider(): postgres.Provider {
    return new postgres.Provider(this.$name, {
      username: this.admin.name,
      password: this.admin.password,
      host: this.host,
      port: this.port,
    }, {
      dependsOn: this,
      parent: this,
    })
  }

}
