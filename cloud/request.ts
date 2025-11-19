export default {
  async fetch(
    request: Request,
    environment: { [key: string]: any },
  ): Promise<Response> {
    const url = new URL(request.url);

    class _Headers extends Headers {
      set cookie(cookie: {
        name: string
        value?: string | null
        age?: number
      }) {
        if (!cookie.value)
          return;

        try {
          this.append('Set-Cookie', Object.entries({
            [cookie.name]: cookie.value,
            'Domain': environment.HOST,
            'Max-Age': cookie.age,
            'Path': '/',
          }).reduce((result: string[], entry) => {
            return entry[1]
              ? result.concat(`${entry[0]}=${entry[1]}`)
              : result;
          }, []).join('; '));
        } catch(error) {
          console.error(error);
        }
      }
    }

    class _Request extends Request {
      override referrer = this.headers.get('Referer') ?? '';
      $referrer = (() => {
        try {
          return new URL(this.referrer ?? '');
        } catch(error) {
          console.error(error);
        }
      })();

      get params(): { [key: string]: string } {
        return url.search?.split('?')?.[1]?.split('&')
          .reduce((result, item) => {
            const parts = item.split('=');

            return {
              ...result,
              [parts[0].toLowerCase()]: parts[1],
            };
          }, {})
          ?? {};
      }

      get cookies(): { [key: string]: string } | undefined {
        return this.headers.get('Cookie')?.split('; ')
          .reduce((result, cookie) => {
            const parts = cookie.split(/=(.*)/);

            return {
              ...result,
              [parts[0]]: parts[1],
            };
          }, {});
      }

      cachable: boolean = (() => {
        switch (true) {
          case this.headers.get('Cache-Control') == 'no-cache':
          case url.searchParams.has('gtm_debug'):
            return false;
          default:
            return true;
        }
      })();

      async process(): Promise<Response | Promise<Response>> {
        if (this.method != 'GET')
          return fetch(this);

        const cache = await caches.open(environment.ENVIRONMENT);
        const extension = url.pathname.split('.').slice(1).pop() ?? '';

        // set common headers
        const headers = new _Headers({

        });

        try {
          headers.cookie = {
            name: 'ip',
            value: this.headers.get('CF-Connecting-IP'),
          };

          if (this.$referrer
            && !this.$referrer.hostname.match(RegExp(`${environment.DOMAIN}$`))) {
            headers.cookie = {
              name: 'initial_referrer',
              value: this.cookies?.initial_referrer ?? this.referrer,
              age: 60 * 60 * 24 * 365,
            };

            headers.cookie = {
              name: 'referrer',
              value: this.referrer,
              age: 60 * 30,
            };
          }

          const redirect: string | undefined = ({

          } as { [key: string]: string })[new URL(
            url.pathname + url.search,
            url.origin.replace(environment.HOST, environment.DOMAIN),
          ).href]?.replace(
            new RegExp(`(www.)?${environment.DOMAIN}`),
            environment.HOST,
          );

          if (redirect) {
            const _redirect = new URL(redirect, url.origin);
            headers.set('Location', _redirect.href);
            return new Response(null, {
              headers: headers,
              status: 301,
            });
          }

          if ([
            'css',
            'js',
          ].includes(extension)) {
            let response = this.cachable ? await cache.match(this) : undefined;
            return response ?? (async() => {
              response = await fetch(this);

              try {
                const content = await response.text();
                response = new Response((await (async() => {
                  if (content.includes('\n'))
                    switch (extension) {
                      case 'css':
                        return content
                          .replace(/\n/g, '')
                          .replace(/\/\*.*?\*\//g, '')
                          .replace(/\{\s*(.)/g, '{$1')
                          .replace(/:\s*(.)/g, ':$1')
                          .replace(/,\s*(.)/g, ',$1')
                          .replace(/;\s*(.)/g, ';$1')
                          .replace(/\s{2,}/g, ' ');
                    }

                  return content;
                })()), {
                  ...response,
                  headers: {
                    ...response.headers,
                    'Content-Type': {
                      js: 'application/javascript',
                      css: 'text/css',
                    }[extension],
                  },
                });

                this.cachable
                && await cache.put(this, response.clone());
              } catch(error) {
                console.warn(error);
                return await fetch(this);
              }

              return response;
            })();
          }
        } catch(error) {
          console.error(error);
        }

        return this.respond(headers);
      }

      async respond(headers: Headers): Promise<Response> {
        const _request = new _Request(url.href, this);
        let response = await fetch(_request, {
          cf: {
            cacheEverything: this.cachable,
          },
        } as RequestInit);

        response = new Response(response.body, response);
        [...headers].forEach((header) => {
          response.headers.append(header[0], header[1]);
        });

        return response;
      }
    }

    return new _Request(request).process();
  },
};
