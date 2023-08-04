import koa, { Context, Next } from 'koa'
import { handler } from '../handler'
import { requestParser } from './parser'
export type AppPlugins = ((ctx: Context, next: Next) => Promise<any> | any)[]
export type AppPluginsNoNext = ((ctx: Context) => Promise<any> | any)[]

export class Application extends koa {
    constructor(private plugins?: AppPlugins | AppPluginsNoNext) {
        super({ proxy: true })
        try {
            this.init()
        } catch (error: any) {
            handler.error(error)
        }
    }
    private init() {
        this.use(async (ctx, next) => {
            await next()
            ctx.set({
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Content-Length, Token, X-Forwarded-Proto, X-Forwarded-For',
                'Access-Control-Expose-Headers': 'Content-Type, Content-Length, Content-Disposition, Transfer-Encoding'
            })
        })
        this.use(requestParser.parse)
        this.plugins?.forEach(plugin => this.use(plugin))
    }
}