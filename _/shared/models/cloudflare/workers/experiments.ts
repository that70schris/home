export default {
  async scheduled(
    controller: ScheduledController,
    environment: { [key: string]: any },
  ) {
    await fetch('https://experiment.amplitude.com/api/1/experiments', {
      headers: {
        Authorization: `Bearer ${environment.AMPLITUDE_MANAGEMENT_KEY}`,
      },
    })
      .then(response => response.json())
      .then(async(response: any) => {
        await environment[environment.ENVIRONMENT].put('experiments',
          JSON.stringify(response.experiments.filter((experiment) => {
            return experiment.enabled && !experiment.deployments?.length
          }).map((experiment) => {
            return {
              key: experiment.key,
              variants: experiment.variants.map((variant) => {
                console.log(variant)

                return {
                  ...variant,
                  payload: {
                    ...variant.payload,
                    url: (() => {
                      const url = new URL(variant.payload.url)

                      if (!url.hostname.includes(environment.HOST))
                        url.hostname = url.hostname
                          .replace(
                            new RegExp(`(www.)?${environment.DOMAIN}`),
                            environment.HOST,
                          )

                      return url
                    })(),
                  },
                }
              }),
            }
          })))
      })
  },
}
