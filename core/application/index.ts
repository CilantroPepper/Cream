import koa, { Context, Next } from 'koa'
import session from 'koa-session'
import { handler } from '../handler'
import { requestParser } from './parser'
export type AppPlugins = ((ctx: Context, next: Next) => Promise<any> | any)[]

export class Application extends koa {
    constructor(private plugins?: AppPlugins) {
        super()
        try {
            this.init()

        } catch (error: any) {
            handler.error(error)
        }
    }
    private init() {
        this.use(session({
            key: 'cream.ss',
            overwrite: true,
            httpOnly: true,
            rolling: true,
            renew: false,
            signed: true
        }, this))
        this.use(async (ctx, next) => {
            await next()
            ctx.set({
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            })
        })
        this.use(requestParser.parse)
        this.plugins?.forEach(plugin => this.use(plugin))
    }
}