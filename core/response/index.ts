import { Context } from "koa"
import { CommonResult } from "../decorator/common"

export const response = {
    success(ctx: Context, data: CommonResult) {
        ctx.status = data.code
        ctx.set(data.headers)
        ctx.body = data.value
    },
    fail(ctx: Context, data: CommonResult) {
        ctx.status = data.code
        ctx.message = data.msg
    }
}