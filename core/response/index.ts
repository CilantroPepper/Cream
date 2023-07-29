import { Context } from "koa"
import { CommonResult } from "./common"

export const response = {
    success(ctx: Context, data: CommonResult) {
        ctx.status = 200
        ctx.set(data.headers)
        ctx.body = data.value
    },
    fail(ctx: Context, data: CommonResult) {
        ctx.status = data.code
        ctx.message = data.msg
    }
}

export const errorMap = {
    RequestError: [400, '发出的请求有错误'], // 发出的请求有错误，服务器没有进行新建或修改数据的操作
    NoPermission: [401, '用户没有权限'], // 用户没有权限（令牌、用户名、密码错误）
    AccessDeny: [403, '访问被禁止'], // 用户得到授权，但是访问是被禁止的
    NotFound: [404, '资源不存在'], // 发出的请求针对的是不存在的记录，服务器没有进行操作
    NotAvailable: [406, '请求不可得'], // 请求的格式不可得
    PermanentlyDeleted: [410, '资源被永久删除'], // 请求的资源被永久删除，且不会再得到的
    ValidationError: [422, '验证错误'], // 当创建一个对象时，发生一个验证错误
    InternalError: [500, '服务器内部错误'], // '服务器发生错误，请检查服务器
    BadGateway: [502, '网关错误'], // 网关错误
    ServiceNotAvailable: [503, '服务不可用'], // 服务不可用，服务器暂时过载或维护
    Timeout: [504, '网关超时'], // 网关超时
    TooLarge: [513, '文件过大'], // 文件过大
}