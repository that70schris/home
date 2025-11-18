export function isEmpty(value: any): boolean {
  switch (value) {
    case '': return true;
    case null: return true;
    case undefined: return true;
  }

  switch (true) {
    case value instanceof Date: return false;
    case value instanceof Function: return true;
    case value instanceof Object: return !Object.keys(value).length;
    case value instanceof Array: return !value.length;
  }

  return false;
}

export function prune(object: any): any {
  switch (true) {
    case object instanceof Array: {
      return object.reduce((result, object) => {
        const o = prune(object);
        if (!isEmpty(o)) {
          result.push(o);
        }

        return result;
      }, []);
    }

    case object instanceof Object: {
      return Object.keys(object).reduce((result: any, key) => {
        switch (key[0]) {
          case '_': break;
          default:
            const r = prune(object[key]);
            if (!isEmpty(r)) {
              result[key] = r;
            }
        }

        return result;
      }, {});
    }
  }

  return !isEmpty(object)
    ? object
    : null;
}
