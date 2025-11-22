import { input } from '@pulumi/kubernetes/types';
import { all } from '@pulumi/pulumi';
import * as json2Toml from 'json2toml';
import { merge } from 'lodash';

import { _Kube } from '..';
import { once } from '../../../shared/decorators';
import { _ConfigMap } from '../configmap';

export class PGCat extends _Kube {
  override image: string = 'ghcr.io/postgresml/pgcat:latest';
  override container_port: number = 6432;

  @once
  get configmap() {
    return all([
      DatabaseUsers.api.name,
      DatabaseUsers.api.password,
      DatabaseInstances.main.admin.name,
      DatabaseInstances.main.admin.password,
      DatabaseInstances.main.privateIpAddress,
      DatabaseInstances.main.replicas?.map((replica) => {
        return replica.privateIpAddress;
      }),
    ]).apply(([
      api_name,
      api_password,
      admin_name,
      admin_password,
      primary_ip,
      ips,
    ]) => {
      return new _ConfigMap(this.name, {
        'pgcat.toml': json2Toml({
          general: {
            admin_username: admin_name,
            admin_password: admin_password,
            ban_time: 60,
            connect_timeout: 5000,
            enable_prometheus_exporter: true,
            healthcheck_delay: 30000,
            healthcheck_timeout: 1000,
            host: '0.0.0.0',
            log_client_connections: false,
            log_client_disconnections: false,
            port: this.container_port,
            shutdown_timeout: 60000,
          },
          pools: DatabaseInstances.main.databases.reduce((result, database) => {
            return merge(result, {
              [database.$name]: {
                default_role: 'any',
                pool_mode: 'transaction',
                primary_reads_enabled: true,
                query_parser_enabled: true,
                query_parser_read_write_splitting: true,
                sharding_function: 'pg_bigint_hash',
                shards: {
                  0: {
                    database: database.$name,
                    servers: [
                      [
                        primary_ip,
                        DatabaseInstances.main.port,
                        'primary',
                      ],
                      ...ips.map((ip) => {
                        return [
                          ip,
                          DatabaseInstances.main.port,
                          'replica',
                        ];
                      }),
                    ],
                  },
                },
                users: {
                  0: {
                    username: api_name,
                    password: api_password,
                    statement_timeout: 0,
                    pool_size: (DatabaseInstances.main.max_connections ?? 100) / 5,
                  },
                },
              },
            });
          }, {}),
        }, {
          newlineAfterSection: true,
          indent: 2,
        }),
      });
    });
  }

  override get volumes(): input.core.v1.Volume[] {
    return super.volumes.concat([
      {
        name: 'pgcat-config',
        configMap: {
          defaultMode: 420,
          name: this.configmap.metadata.name,
        },
      },
    ]);
  }

  override get volume_mounts(): input.core.v1.VolumeMount[] {
    return super.volume_mounts.concat([
      {
        name: 'pgcat-config',
        mountPath: '/etc/pgcat/pgcat.toml',
        subPath: 'pgcat.toml',
      },
    ]);
  }

}
