import Base64 from 'crypto-js/enc-base64'
import Utf8 from 'crypto-js/enc-utf8'
import { Context, Next } from "koa"
import { Chunk } from "./chunk"

export const requestParser = {
    // Mid-ware: parse post request body
    async parse(ctx: Context, next: Next) {
        if (ctx.method.toLowerCase() === 'post') {
            await (new Promise<void>(resolve => {
                if (ctx.headers["content-type"]?.includes("multipart/form-data")) {
                    Chunk(ctx)
                        .then(res => {
                            ctx.files = res.files
                            ctx.fields = res.fields
                            resolve()
                        })
                        .catch(e => {
                            console.error('[Error] Error occur while parsing request data.\n', e)
                            resolve()
                        })
                } else {
                    let data = Buffer.from('')
                    ctx.req.on('data', chunk => data += chunk)
                    ctx.req.on('end', async () => {
                        try {
                            ctx.fields = JSON.parse(data.toString('utf-8'))
                        } catch (e) {
                        } finally {
                            resolve()
                        }
                    })
                }
            }))
            await next()
        } else await next()
    },
    // parse formdata
    parseForm(body: string, boundary: string) {
        const parts = body.split(boundary)
        // Remove the useless part
        parts.pop()
        parts.shift()
        const result: { [key: string]: any } = {}
        for (let i in parts) {
            // Remove the useless char of each part
            parts[i] = parts[i].slice(0, -2).trim()
            let enter: number
            let key: string, value: string
            if ((enter = parts[i].indexOf('\r\n\r\n')) !== -1) {
                value = parts[i].slice(enter + 4)
            } else if ((enter = parts[i].indexOf('\n\n')) !== -1) {
                value = parts[i].slice(enter + 2)
            } else if ((enter = parts[i].indexOf('\r\r')) !== -1) {
                value = parts[i].slice(enter + 2)
            } else {
                value = ''
            }
            // Get name
            key = this.bin2utf(parts[i].match(/name="([^"]+)"/)?.[1] as string)
            if (key !== 'file') value = this.bin2utf(value)
            result[key] = value
        }
        return result
    },
    // Parse content-type
    parseContentType(origin: string) {
        const result: { [key: string]: string } = {}
        const parts = origin.split(';').filter((item, index) => {
            if (index === 0) {
                result['ContentType'] = item
            }
            return item.trim().indexOf('=') > 0
        })
        parts.forEach(item => {
            const pair = item.split('=')
            result[pair[0].trim()] = pair[1].trim()
        })
        return result
    },
    // Convert binary to utf
    bin2utf(origin: string | undefined) {
        if (!origin) return ''
        return Buffer.from(origin, 'binary').toString()
    },
    // Convert base64 to utf8
    base64Decode(str: string) {
        return Base64.parse(str).toString(Utf8)
    }
}