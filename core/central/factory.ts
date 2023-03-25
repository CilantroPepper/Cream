import fs from 'fs'
import { Context, Next } from "koa"
import { Constructor, Container } from "."
import { AppPlugins, AppPluginsNoNext, Application } from "../application"
import { DataBase, PoolConfig } from "../database"
import { ParamType } from "../decorator/param"
import { PropType } from "../decorator/property"
import { MetaDataType } from "../decorator/type"
import { handler } from "../handler"
import { response } from "../response"

export interface CreamOptions {
    controller: Constructor<any>[],
    provider: Constructor<any>[],
    plugin?: AppPluginsNoNext,
    midware?: AppPlugins
}
export interface CreamConfig {
    port: number
    database: PoolConfig
}
export type ParamHandler = (p: { ctx: Context, type: string, key: string }) => any
export type PropHandler = (p: { ctx: Context, type: string, key: string }) => any

export class Cream {
    constructor(private options: CreamOptions) {
        const ioc = this.ioc
        const router = this.router
        options.provider.forEach(item => ioc.register(item))
        options.controller.forEach(item => {
            ioc.register(item)
            router.set(Reflect.getMetadata(MetaDataType.CONTROLLER_PATH, item), item)
        }) // Register Controller
    }

    getContainer() {
        return this.ioc
    }
    getRouter() {
        return this.router
    }

    useParamHandler(process: ParamHandler) {
        this.paramHandler.push(process)
    }
    usePropHandler(process: PropHandler) {
        this.propHandler.push(process)
    }

    /** Start Server */
    async bootstrap() {
        const config = await this.loadConfig()
        if (config.database) this.db = new DataBase(config.database)
        const app = new Application([...(this.options?.midware || []), this.requestHandler.bind(this)])
        app.proxy = true
        app.listen(config.port, () => {
            console.info('=== Cream V3.0 Server ===\n')
            console.info('Listening ... http://localhost:%d', config.port)
        })
    }
    private readonly ioc = new Container()
    private db: DataBase | null = null
    private readonly router = new Map<string, Constructor<any>>()
    private readonly paramHandler: ParamHandler[] = []
    private readonly propHandler: PropHandler[] = []
    private async requestHandler(ctx: Context, next: Next) {
        try {
            await next()
            handler.access(ctx)
            const data: any = await this.handler.call(this, ctx)
            if (data instanceof Buffer || data?.data instanceof Buffer)
                response.success(ctx, data?.data ?? data ?? '', data?.headers)
            else
                response.success(ctx, {
                    code: data?.code ?? 200,
                    data: data?.data !== void 0 ? data?.data : data ?? null,
                    msg: data?.msg ?? 'success'
                }, data?.headers)
        } catch (e: any) {
            response.fail(ctx, typeof e?.code === 'number' ? e.code : 404, e?.msg ?? 'Request Error')
            handler.error(e)
        }
    }

    private async handler(ctx: Context) {
        try {
            for (let plugin of (this.options?.plugin ?? [])) await plugin?.(ctx)
        } catch (error: any) {
            if (error?.code === 200) return error // Can be the response
            else throw error
        } const router = this.router
        const path = ctx.path
        const unitList = path.split('/').map(item => item.trim())
        let unit = ''
        let index: any = 0
        let controller: Constructor<any> | null = null
        for (let idx in unitList) {
            if (unit[unit.length - 1] !== '/') unit += '/'
            unit += unitList[idx]
            index = idx
            if (controller = router.get(unit) ?? null) break
        }
        if (!controller) throw { code: 404, data: null, msg: 'Not Found', name: ctx.path }
        unit = '/' + unitList.slice(Number(index) + 1).filter(item => item.length > 0).join('/')
        const routes: Record<string, any> = Reflect.getMetadata(MetaDataType.REQUEST_PATH, controller.prototype)
        if (!routes?.[unit]) throw { code: 404, data: null, msg: 'Not Found', name: ctx.path }
        if (ctx.method.toUpperCase() === 'OPTIONS') return 'ok'
        if (!routes[unit]?.method?.includes(ctx.method.toUpperCase())) throw { code: 503, data: null, msg: 'Forbidden', name: ctx.path }
        const instance = this.ioc.resolve(controller)
        const route = instance?.[routes[unit]?.key]
        const params: ParamType[] = Reflect.getMetadata(MetaDataType.INJECT_PARAM, route) ?? []
        const paramInjection = params?.sort((a, b) => a.index - b.index)?.map(param => {
            if (param.type === 'query') return ctx.query[param.key]
            if (param.type === 'form') return ctx?.data?.[param.key]
            if (param.type === 'file') return ctx?.data?.['file']
            if (param.type === 'formMap') return ctx?.data ?? {}
            if (param.type === 'queryMap') return ctx?.query ?? {}
            return this.paramHandler?.reduce((pre, cur) => pre ? pre : cur?.({ ctx, type: param.type, key: param.key }), null)
        })
        const props: PropType[] = Reflect.getMetadata(MetaDataType.INJECT_PROP, instance) ?? []
        const propInjection: Record<string, any> = {}
        props.forEach(prop => {
            let value: any = null
            switch (prop.type) {
                case 'table':
                    value = this.db?.getBase(prop.value)
                    break
                case 'database':
                    value = this.db
                    break
                default:
                    value = this.propHandler?.reduce((pre, cur) => pre ? pre : cur?.({ ctx, type: prop.type, key: prop.value }), null)
            }
            propInjection[prop.propKey] = value
        })
        return await route?.call(Object.assign({}, instance, propInjection), ...paramInjection)
    }

    /** Initialize Options From config.json */
    private async loadConfig() {
        if (!fs.existsSync('./config.json')) throw Error('File not exist:: config.json')
        try {
            const data: CreamConfig = JSON.parse(fs.readFileSync('./config.json').toString("utf-8"))
            return data
        } catch (error) {
            throw error
        }
    }

}