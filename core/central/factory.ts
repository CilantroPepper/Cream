import { Context, Next } from "koa"
import { Constructor, Container } from "."
import { AppPlugins, Application } from "../application"
import { MetaDataType } from "../decorator/type"
import { handler } from "../handler"
import { response } from "../response"
import { ParamType } from "../decorator/param"
import fs from 'fs'
import { DataBase, PoolConfig } from "../database"
import { PropType } from "../decorator/property"

export interface CreamOptions {
    controller: Constructor<any>[],
    provider: Constructor<any>[],
    plugins?: AppPlugins,
}
export interface CreamConfig {
    port: number;
    database: PoolConfig;
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

    /** Start Server */
    async bootstrap() {
        const config = await this.loadConfig()
        this.db = new DataBase(config.database)
        const plugins = this.options.plugins ?? []
        plugins.push(this.requestHandler.bind(this))
        const app = new Application(plugins)
        app.listen(config.port, () => {
            console.info('=== Cream V3.0 Server ===\n')
            console.info('Listen %d ...', config.port)
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
            response.fail(ctx, e?.code ?? 404, e?.msg ?? 'Request Error')
            handler.error(e)
        }
    }

    private async handler(ctx: Context) {
        const router = this.router
        const path = ctx.path
        const unitList = path.split('/').map(item => item.trim()).filter(item => item.length > 0)
        let unit = unitList.length === 0 ? '/' : ''
        let index: any = 0
        let controller: Constructor<any> | null = unitList.length === 0 ? router.get(unit) ?? null : null
        if (unitList.length > 0) {
            for (let idx in unitList) {
                unit += '/' + unitList[idx]
                index = idx
                if (controller = router.get(unit) ?? null) break
            }
        }
        if (!controller) throw { code: 404, data: null, msg: 'Not Found', name: ctx.path }
        unit = '/' + unitList.slice(Number(index) + 1).join('/')
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
            if (param.type === 'formdata') return ctx?.data
            if (param.type === 'querydata') return ctx?.query
            return this.paramHandler?.reduce((pre, cur) => pre ? pre : cur?.({ ctx, type: param.type, key: param.key }), null)
        })
        const props: PropType[] = Reflect.getMetadata(MetaDataType.INJECT_PROP, instance) ?? []
        const propInjection: Record<string, any> = {}
        props.forEach(prop => {
            let value: any = null
            switch(prop.type) {
                case 'database':
                    value = this.db?.getBase(prop.value)
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