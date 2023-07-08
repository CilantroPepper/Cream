import mime from "mime"

export class CommonResult {
    static ok<T extends object | string | number>(value: T, headers?: Record<string, any>) {
        const data = JSON.stringify({
            code: 200,
            data: value,
            msg: 'success'
        })
        const res = new CommonResult(data, 200, 'success')
        res.headers = headers ?? {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
        return res
    }
    static file(value: Buffer, name: string, attachment?: boolean) {
        const res = new CommonResult(value, 200, 'success')
        res.headers = {
            'Content-Type': mime.getType(name) ?? 'application/json',
            'Content-Length': value.length.toString(),
            'Content-Disposition': `${attachment ? 'attachment;' : ''}filename=${name}`
        }
        return res
    }
    static fail(params?: { msg?: string, code?: number }) {
        const data = JSON.stringify({
            code: params?.code ?? 500,
            msg: params?.msg ?? 'Request Error',
            data: null
        })
        const res = new CommonResult(data, params?.code ?? 500, params?.msg ?? 'Request Error')
        res.headers = {
            'Content-Type': 'application/json',
            'Content-Length': data.length.toString()
        }
        return res
    }
    private _headers: Record<string, string> = {}
    private _value: any
    private _code: number
    private _msg: string
    private constructor(value: any, code?: number, msg?: string) {
        this._value = value
        this._code = code ?? 200
        this._msg = msg ?? ''
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
    set code(code: number) {
        this._code = code
    }
    get code() {
        return this._code
    }
    set msg(msg: string) {
        this._msg = msg
    }
    get msg() {
        return this._msg
    }
}