/**
 * 不会被封装成JSON发送的result
 */
export class CommonResult {
    private _headers: Record<string, string> = {}
    private _value: any = null
    constructor(value: any) {
        this._value = value
    }
    set headers(obj: Record<string, string>) {
        this._headers = obj
    }
    get headers() {
        return this._headers
    }
    set value(v: any) {
        this._value = v
    }
    get value() {
        return this._value
    }
}