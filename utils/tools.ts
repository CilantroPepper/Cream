import CryptoJS from "crypto-js"
import Base64 from "crypto-js/enc-base64"
import Utf8 from "crypto-js/enc-utf8"
import mime from "mime"

export const tools = {
    // 加密
    crypto: {
        aesEncrypt: (origin: string, key: string) => CryptoJS.AES.encrypt(origin, key).toString(),
        aesDecrypt: (origin: string, key: string) => CryptoJS.AES.decrypt(origin, key).toString(Utf8),
        base64Decode: (origin: string) => Base64.parse(origin).toString(Utf8),
        base64Encode: (origin: string) => Base64.stringify(Utf8.parse(origin)),
        md5: (origin: string) => CryptoJS.MD5(origin).toString(Utf8)
    },
    // MimeType
    mime,
    date: {
        toString(date?: Date | null, divider: string = '-') {
            const current = date ?? new Date()
            return `${current.getFullYear()}${divider}${current.getMonth() + 1}${divider}${current.getDate()}`
        },
        toDetailString(date?: Date | null, divider: string = '-') {
            const target = date ?? new Date()
            return tools.date.toString(target, divider) + ` ${target.getHours()}:${target.getMinutes()}:${target.getSeconds()}`
        },
        toChineseString(date?: Date) {
            const current = date ?? new Date()
            return `${current.getFullYear()}年${current.getMonth() + 1}月${current.getDate()}日`
        },
        get(offset?: number) {
            const current = new Date()
            if (offset) current.setDate(current.getDate() + offset)
            return current
        }
    },
    checkParam(target: Record<string, string>, required: string[]) {
        if (!target) return true
        return required.reduce((pre, cur) => {
            if (!pre) return pre
            return target[cur] !== void 0
        }, true)
    },
    getCurrentDateString() {
        const date = new Date()
        const monthString = date.getMonth() + 1 >= 10 ? `${ date.getMonth() + 1 }` : `0${ date.getMonth() + 1 }`
        const dateString = date.getDate() >= 10 ? `${ date.getDate() }` : `0${ date.getDate() }`
        return `${ date.getFullYear() }-${ monthString }-${ dateString }`
    },
    generalUUID(length: number = 6) {
        const dict = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789'
        let uuid = ''
        for (let i = 0; i < length; ++i)
            uuid += dict[Math.floor(Math.random() * dict.length)]
        return uuid
    }
    
}
