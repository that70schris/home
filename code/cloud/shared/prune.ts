import { isEmpty } from 'lodash'

export function prune(object: any): any {
  switch (true) {
    case object instanceof Array: {
      return object.reduce((result, object) => {
        const o = prune(object)
        if (!isEmpty(o))
          result.push(o)

        return result
      }, [])
    }

    case object instanceof Object: {
      return Object.keys(object).reduce((result: any, key) => {
        switch (key[0]) {
          case '_': break
          default:
            const r = prune(object[key])
            if (!isEmpty(r))
              result[key] = r

        }

        return result
      }, {})
    }
  }

  return !isEmpty(object)
    ? object
    : null
}
