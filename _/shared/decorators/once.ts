export function once(
  target, name, {
    enumerable,
    configurable,
    get: getter,
    set: setter,
  }: PropertyDescriptor = {},
): any {
  if (!getter)
    throw new Error(`@once can't be used with a property (${target.constructor.name}.${name})`)

  if (setter)
    throw new Error(`@once can't be used with a setter (${target.constructor.name}.${name})`)

  function set(that, value) {
    Object.defineProperty(that, name, {
      enumerable,
      configurable,
      value,
    })

    return value
  }

  return {
    get() {
      return set(this, getter.call(this))
    },
    set(value: any) {
      set(this, value)
    },
  }
}
