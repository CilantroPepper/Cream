import fs from 'fs'
import { Context } from 'koa'
import { resolve } from 'path'

function setLogDir() {
    try {
        if (!fs.existsSync(resolve(__dirname, './log'))) fs.mkdirSync(resolve(__dirname, './log'))
    } catch (error) {
        throw error
    }
}

export const handler = {
    error: async (err: Error & { msg?: string }) => {
        try {
            const msg = `Error: ${err?.name ?? 'Unknown Error'}:: ${err?.message ?? err?.msg ?? 'Unknown Error Message'}`
            console.log(`[Error] ${msg}`)
            setLogDir()
            fs.writeFileSync(resolve(__dirname, './log/error.log'), `${new Date().toLocaleDateString()}\n${msg}\n`, { flag: 'a' })
        } catch (error) {
            console.log(`[Error] ${error}`)
        }
    },
    access: async (ctx: Context) => {
        try {
            setLogDir()
            const msg = `${new Date().toLocaleDateString()}\nPath: ${ctx.path}, Query: ${ctx.querystring}, ip: ${ctx.ips}\n`
            fs.writeFileSync(resolve(__dirname, './log/access.log'), msg, { flag: 'a' })
        } catch (error: any) {
            handler.error(new Error(error))
        }
    }
}