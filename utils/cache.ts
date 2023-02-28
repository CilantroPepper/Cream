export interface CacheOptions {
    stdTtl?: number,
    checkTime?: number
}
export class Cache {
    private readonly vector = new Map<string, { create: number, ttl: number, value: any }>()
    private readonly stdTtl: number
    constructor(options?: CacheOptions) {
        this.stdTtl = options?.stdTtl ?? 120
        setInterval(this.check.bind(this), (options?.checkTime ?? 180) * 1000)
    }
    private check() {
        const current = new Date().getTime()
        this.vector?.forEach((item, key) => {
            if (current - item.create > item.ttl * 1000) this.vector.delete(key)
        })
    }
    public get(key?: string) {
        if (!key) return null
        return this.vector.get(key)?.value ?? null
    }
    public set(key: string, value: any, ttl?: number) {
        this.vector?.set(key, {
            create: new Date().getTime(),
            ttl: ttl ?? this.stdTtl,
            value
        })
    }
    public del(key: string) {
        if (this.vector?.has(key)) this.vector?.delete(key)
    }
}
