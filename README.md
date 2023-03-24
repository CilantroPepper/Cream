# Cream V3.0

[TOC]

## 简介

一个轻量的 Web 服务器，使用 NodeJS + TypeScript 编写，具有基本的 IoC 和 DI 模式，底层基于 Koa2 和MySQL。



## 安装依赖

```shell
npm install
```



## 构建/打包

- 单文件打包：

  ```shell
  npm run build
  ```

- 单文件最小体积打包

  ```shell
  npm run minify
  ```



## 快速开始

1. 打包 Cream（见上）

2. 新建 NodeJS 项目并将 `cream.js` 和 `interface.ts` 拉入工程目录

   ```shell
   npm init -y
   tsc --init
   ```

   - 进入 `tsconfig.json`，将装饰器配置打开：

     ```json
     "experimentalDecorators": true, /* Enable experimental support for TC39 stage 2 draft decorators. */
     "emitDecoratorMetadata": true, 
     ```

   - 建立以下目录结构

     | project

     ----| cream

     --------| cream.js

     --------| interface.ts

     ----| router

     --------| demo

     ------------| controller.ts

     ------------| service.ts

     ----| <em style="color: #ff0000">index.ts</em>

     ----| <em style="color: #ff0000">config.json</em>

3. 编写入口

   ```typescript
   import { Cream, Container } from './cream/cream'
   import { UserController } from './router/user/controller'
   import { UserService } from './router/user/service'
   import { Authorize } from './plugins/authorize'
   import { PropHandler } from './cream/interface'
   import koaStatic from 'koa-static'
   
   const external = new Container() // 引入外部 Ioc 容器
   external.register(Authorize)
   
   const auth: Authorize = external.resolve(Authorize)
   const propHandler: PropHandler = (option) => {
       const { key, type } = option
       if (type !== 'external') return null
       return external.resolve(key)
   } // 处理特定属性插槽
   const app = new Cream({
       controller: [UserController], // 注册 Controller
       provider: [UserService], // 注册 Service
       plugin: [auth.interceptor.bind(auth)], // 请求插槽
       midware: [koaStatic(resolve(__dirname, "./public"), { hidden: false })]
   })
   app.usePropHandler(propHandler) // 属性处理插槽
   
   app.bootstrap() // Start Server
   ```

   

4. 编写 Controller 和 Service

   ```typescript
   import { Controller, Database, Get, Property, Query } from "../../cream/cream"
   import { Base } from "../../cream/interface"
   import { Authorize } from "../../plugins/authorize"
   import { UserService } from "./service"
   
   @Controller('/user')
   export class UserController {
       constructor(private readonly service: UserService) { }
   
       @Database('user_profile')
       private base!: Base
   
       @Property(Authorize, 'external')
       private auth!: Authorize
   
       @Get('/login')
       async userLogin(
           @Query('account') account: string,
           @Query('password') password: string) {
               return await this.service.userLogin(account, password, this.base, this.auth)
       }
       @Get('/getUserByToken')
       async getUserByToken(@Query('token') token: string) {
           return await this.service.getUserByToken(token, this.base, this.auth)
       }
   }
   ```

   ```typescript
   import { tools } from "../../cream/cream"
   import { Base } from "../../cream/interface"
   import { Authorize } from "../../plugins/authorize"
   
   export class UserService {
       async userLogin(account: string, password: string, base: Base, auth: Authorize) {
           const { items } = await base.fetch(['account', 'openid', 'auth', 'signUpDate', 'lastLoginTime'], [{ account, password }])
           if (items.length === 0) return { code: 400, data: null, msg: 'Wrong account or password' }
           let token = tools.generalUUID(16)
           while (auth.get(token)) token = tools.generalUUID(16)
           auth.set(token, { auth: items[0].auth, openid: items[0].openid })
           return {
               userProfile: items[0],
               token
           }
       }
   
       async getUserByToken(token: string, base: Base, auth: Authorize) {
           const openid = auth.get(token)?.openid
           if (!openid) return { code: 400, data: null, msg: 'Token invalid' }
           const { items } = await base.fetch(['account', 'openid', 'auth', 'signUpDate', 'lastLoginTime'], [{ openid }])
           if (items.length === 0) return { code: 401, data: null, msg: 'User Not Found' }
           return items[0]
       }
   }
   ```

5. 配置 `config.json`

   ```json
   {
       "port": 82, // 监听端口
       "database": {
           // 数据库配置
           "host": "localhost", // 主机名
           "port": 3306, // 端口
           "database": "XX", // 数据库名 
           "user": "User Name", // 用户名
           "password": "Your Password", // 密码
           "connectionLimit": 20 // 最大同时连接数
       }
   }
   ```

6. 启动服务

   - 安装 `ts-node` / `ts-node-dev` 等服务

   ```shell
   ts-node-dev index
   ```

   



## 使用

### Plugins 插件

plugin 是在 Controller 处理请求之前的中间件，他是一个数组：

```typescript
type AppPluginsNoNext = ((ctx: Context) => Promise<any> | any)[]
```

他将会在每个请求进入 Controller 处理流程前，按照注入顺序逐个调用，如果要在某个插件中拦截该请求，只需要使用 `throw` 抛出一个对象 `{code: number; msg: string}`，其中的 `code` 和 `msg` 将分别应用于请求的响应状态 `statusCode` 和响应消息 `statusMessage`

> 请注意：如果抛出的 `code` 为 200 的话，它将不被认为是一个错误，而是将你所抛出的错误原封不动的尝试交给 Response Parser 处理，他可能会被封装成 JSON 然后完全返回到客户端

---


### Midwares 中间件

`midware` 对应了 Koa 的中间件，他将作用于解析请求并分发 Controller 之前，如果你想使用 `koa-static` 一类的中间件，你需要使用该属性来让 Cream 引用他（引用格式详见根目录下 `interface.ts` 的 `CreamOptions`）

```typescript
type AppPlugins = ((ctx: Context, next: Next) => Promise<any> | any)[]
```



### ParamHandler 参数处理器

Cream 使用了控制反转的设计模式，在每个客户端请求时自动调用相应的 `Controller` 和 `Service` 来处理请求，在注入相应的 Controller 中的方法时，允许开发者使用装饰器来描述参数类型，并且自定义注入值，比如：

```typescript
@Controller('/')
export class IndexController {
    @Post('')
    async getIndex(
    	@Query('name') name: string,
        @Form('message') message: string) {
        return { name, message }
    }
}
```

Cream 内置了几种参数类型：

- Query：查询参数，例如 `?id=1234&name=Mike` 能被 `@Query('id')` 和 `@Query('name')` 捕获并注入方法
- Form：表单字段或 JSON 字段，例如使用 POST 方法提交的表单 `{ id: 1234, name: 'Mike' }` 能被 `@Form('id')` 和 `@Form('name')` 捕获并注入
- QueryMap：所有查询参数，使用 `@QueryMap queryMap: Record<string, any>` 可以捕获全部查询参数并且作为一个对象注入
- FormMap：所有表单字段或 JSON 字段，使用 `@FormMap formMap: Record<string, any>` 可以捕获全部表单数据或 JSON 数据并作为一个对象注入

当然你也可以自定义参数类型，只需要使用：

`@Param(key: string, type: string)` 来装饰引元，即可完成自定义参数，比如

```typescript
@Get('')
async getIndex(@Param('index', 'myParamType') param: string) {
    // ...
}
```

自定义参数通常需要配合自定义的**参数处理器**来使用，`Cream` 对象提供一个参数处理器注册入口：

`useParamHandler(handler: ParamHandler)`

```typescript
type ParamHandler = (p: { 
    ctx: Context, // 当前请求上下文
    type: string, // 自定义的类型
    key: string   // 自定义的值
}) => any
```

Cream 会在遇到自定义的参数类型时调用自定义参数处理器，直到找到一个返回值不为 `null` 和 `undefined` 的处理器后，注入到对应的引元上。所以，合法的处理器应该在遇到非本模块负责的自定义类型时返回 `null`，你可以通过不断调用 `useParamHandler` 方法来注册多个处理器。

---



### PropHandler 属性处理器

类似参数类型注入，Cream 也提供了对象属性的注入，需要注意，该注入是**一次性**的，也即注入后只在当前上下文有效，Cream 内置了两种属性类型：`@Database` 用以获取一个数据库连接，`@Table(name: string)` 用以获取一组API来控制某一个数据库表（CURD操作），他们的用法非常简单：

```typescript
@Controller('/')
export class IndexController {
	@Table('NOTIFICATION')
    private table!: Table

    @Database
    private db!: DataBase
    
    // ...
    
    @Get('')
    async getIndex() {
        const { items } = await this.table.fetch(['title, content, date'], [{ date: tools.getCurrentDate() }])
        return items
    }
}
```

> 有关 Database 的元操作 `fetch` | `update` | `put` | `remove` 详见 **Database 元操作**

Cream 也支持自定义属性类型和他的处理器，用法与参数类型和参数处理器相差无几。

使用装饰器 `@Property(value: string, type: string)` 来装饰一个 Controller 类的属性成员。

`Cream` 对象提供了一个注册入口：`usePropHandler(handler: PropHandler)`

```typescript
type PropHandler = (p: { 
    ctx: Context, // 当前请求上下文
    type: string, // 自定义属性类型
    key: string   // 自定义值
}) => any
```

同样的，你应该在自定义处理器一开始判断属性类型，如果不是该模块负责的类型应该直接返回一个 `null`

你可以通过不断调用 `usePropHandler` 方法来注册不同的属性处理器。

---



### 获取内置单例 IoC 容器

Cream 对象内置一个管理 Cream 所用到的类对象的 IoC 容器，你可以使用 `Cream.getContainer()` 来获取它，并且使用 `register()` 和 `resolve()` 方法来注册/获取一个单例对象。

---



### 创建外部 IoC 容器

Cream 模块导出了名为 `Container` 的 IoC 容器，你可以使用 `new Container()` 来创建外部的 IoC 容器并且运用到其他场景中。注意，该 IoC 容器中的所有对象都会是**单例**的。

---





## 数据库操作

Cream 基于 MySQL 封装了连接池并且提供了一套类似 NoSQL 的 API：`fetch` | `put` | `remove` | `update`，可以实现基本的增删改查操作。 
如果你想自己编写 SQL，请使用 `@Database` 来获取一个数据库连接，然后调用其 `query` 方法来使用 SQL。




## 接口

```typescript
import { Context, Next } from 'koa'
export interface Result<T> {
    items: T[],
    fields: any
}
export interface PoolConfig {
    host: string,
    port: number,
    database: string,
    user: string,
    password: string,
    connectionLimit: number
}
export interface Table {
    fetch<T extends object>(items: (keyof T)[], conditions: Record<string, any>[]): Promise<Result<T>>
    put<T extends object>(entity: T): Promise<Result<object>>
    remove(conditions: Record<string, any>): Promise<object>
    update<T extends object>(entity: T, conditions: Record<string, any>[]): Promise<object>
}
export type Constructor<T> = new (...args: any[]) => T
export type AppPlugins = ((ctx: Context, next: Next) => Promise<any> | any)[]
export type AppPluginsNoNext = ((ctx: Context) => Promise<any> | any)[]
export type ParamHandler = (p: { ctx: Context, type: string, key: string }) => any
export type PropHandler = (p: { ctx: Context, type: string, key: string }) => any
export interface CreamOptions {
    controller: Constructor<any>[],
    provider: Constructor<any>[],
    plugins?: AppPluginsNoNext,
    midware?: AppPlugins
}
export interface Cache {
    get: <T>(k: string) => T | null;
    set: <T>(k: string, v: T) => void;
    del: () => void
}
export interface CacheOptions {
    stdTtl?: number,
    checkTime?: number
}
export interface CreamConfig {
    port: number;
    database: PoolConfig;
}
```



