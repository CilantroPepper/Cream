import CryptoJS from "crypto-js"
import Base64 from "crypto-js/enc-base64"
import Utf8 from "crypto-js/enc-utf8"
import mime from "mime"

export const tools = {
    crypto: {
        aesEncrypt: (origin: string, key: string) => CryptoJS.AES.encrypt(origin, key).toString(),
        aesDecrypt: (origin: string, key: string) => CryptoJS.AES.decrypt(origin, key).toString(Utf8),
        base64Decode: (origin: string) => Base64.parse(origin).toString(Utf8),
        base64Encode: (origin: string) => Base64.stringify(Utf8.parse(origin)),
    },
    mime,
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