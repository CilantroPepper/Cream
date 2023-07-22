import busboy from "busboy"
import { Context } from "koa"

export interface ChunkResult {
    files: Record<string, {
        filename: string,
        buffer: Buffer,
        encoding: BufferEncoding,
        mimeType: string
    }>
    fields: Record<string, string>
}

export const Chunk = (ctx: Context) => new Promise<ChunkResult>((resolve, reject) => {
    const result: ChunkResult = {
        files: {},
        fields: {}
    }
    const bb = busboy({ headers: ctx.req.headers, defParamCharset: 'utf8' })
    bb.on('file', (name, stream, info) => {
        const { filename, mimeType, encoding } = info
        const chunks: any[] = []
        stream.on('data', chunk => chunks.push(chunk))
        stream.on('end', () => {
            result.files[name] = {
                buffer: Buffer.concat(chunks),
                filename: filename,
                encoding: (["ascii", "utf8", "utf-8", "utf16le", "ucs2", "ucs-2", "base64", "base64url", "latin1", "binary", "hex"]).includes(encoding) ? encoding : 'binary' as any,
                mimeType
            }
        })
    })
    bb.on('field', (name, value, info) => {
        result.fields[name] = value
    })
    bb.on('finish', () => {
        ctx.req.unpipe(bb)
        resolve(result)
    })
    bb.on('error', (e) => reject(e))
    ctx.req.pipe(bb)
})