import { Context } from 'koa'
import { tools } from '../../app'

export const handler = {
    error: async (err: Error & { msg?: string }) => {
        console.error(`${tools.date.toDetailString()} [Error] ${err.name ?? 'Unknown Error'}\n`, err?.stack || err.msg)
    },
    access: async (ctx: Context) => {
        console.log(`${tools.date.toDetailString()} [Access] A client connected\n`, `Request Path: ${ctx.path}`, `Request IP: ${ctx.request.ip}`)
    }
}