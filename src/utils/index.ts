export function is(val: unknown, type: string) {
    return toString.call(val) === `[object ${type}]`
}
export function isObject(val: any): val is Record<any, any> {
    return val !== null && is(val, 'Object')
}

export function isEmpty<T = unknown>(val: T): val is T {
    if (isArray(val) || isString(val))
        return val.length === 0

    if (val instanceof Map || val instanceof Set)
        return val.size === 0

    if (isObject(val))
        return Object.keys(val).length === 0

    return false
}

export function isNumber(val: unknown): val is number {
    return is(val, 'Number')
}

export function isString(val: unknown): val is string {
    return is(val, 'String')
}
export function isArray(val: any): val is Array<any> {
    return val && Array.isArray(val)
}
