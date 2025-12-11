import * as datadog from '@pulumi/datadog'
import { Chart } from '@pulumi/kubernetes/helm/v4'
import { Config } from '@pulumi/pulumi'
import { _Config } from 'shared'
import { once } from 'shared/decorators'
import * as YAML from 'yaml'

declare global {
  interface String {
    get datadog(): string
  }
}

Object.defineProperties(String.prototype, {
  datadog: {
    get: function() {
      return this.replace(/[\s:"+-=><!(){}[\]^~\\#]/g, (character) => {
        return `\\${character}`
      })
    },
  },
})

export class Datadog {
  static apiKey = this.config.get('apiKey')
  static appKey = this.config.get('appKey')

  static logIndex = new datadog.LogsIndex('main', {
    name: _Config.env,
    retentionDays: 3,
    filters: [{
      query: `env:${_Config.env}`,
    }],
    exclusionFilters: [{
      name: 'WWW browser noise',
      isEnabled: true,
      filters: [{
        sampleRate: 1,
        query: `service:www source:browser (${[
          'Invalid selector: *',
          'Uncaught "Object Not Found Matching Id:*, MethodName?update, ParamCount:*"',
        ].map(message => message.datadog).join(' OR ')})`,
      }],
    }],
  }, {

  })

  @once
  get chart() {
    return new Chart('datadog', {
      chart: 'datadog',
      repositoryOpts: {
        repo: 'https://helm.datadoghq.com',
      },
      values: {
        clusterAgent: {
          enabled: true,
          token: Datadog.config.object.token,
          envDict: {
            DD_ENV: _Config.env,
            DD_EXTERNAL_METRICS_PROVIDER_BUCKET_SIZE: '600', // 120
            DD_EXTERNAL_METRICS_PROVIDER_MAX_AGE: '600', // 300
          },
          metricsProvider: {
            enabled: true,
            useDatadogMetrics: true,
          },
          confd: {
            'postgres.yaml': YAML.stringify({
              cluster_check: true,
              instances: [
                DatabaseInstances.main,
              ].map((instance) => {
                return {
                  dbm: true,
                  host: instance.host,
                  port: 5432,
                  username: 'datadog',
                  password: new _Config('datadog').object.password,
                  database_autodiscovery: {
                    enabled: true,
                  },
                  collect_schemas: {
                    enabled: true,
                  },
                  collect_settings: {
                    enabled: true,
                  },
                  gcp: {
                    project_id: new Config('gcp').require('project'),
                    instance_id: instance.$name,
                  },
                }
              }),
            }),
          },
        },
        agents: {
          image: {
            tagSuffix: 'jmx',
          },
          priorityClassCreate: true,
          localService: {
            forceLocalServiceEnabled: true,
          },
          containers: {
            agent: {
              resources: {
                requests: {
                  cpu: '200m',
                  memory: '500Mi',
                },
              },
            },
            traceAgent: {
              resources: {
                requests: {
                  cpu: '100m',
                  memory: '250Mi',
                },
              },
            },
            processAgent: {
              resources: {
                requests: {
                  cpu: '100m',
                  memory: '250Mi',
                },
              },
            },
          },
        },
        datadog: {
          apiKey: Datadog.apiKey,
          appKey: Datadog.appKey,
          apm: {
            portEnabled: true,
            instrumentation: {
              skipKPITelemetry: true,
            },
          },
          logs: {
            enabled: true,
            containerCollectAll: true,
          },
          envDict: {
            DD_ENV: _Config.env,
          },
        },
        providers: {
          gke: {
            autopilot: true,
          },
        },
      },
    }, {

    })
  }

  includes = [
    this.chart,
  ]
}
