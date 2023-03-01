# Cream V3.0



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
   import Cream, { Container } from './cream/cream'
   import { UserController } from './router/user/controller'
   import { UserService } from './router/user/service'
   import { Authorize } from './plugins/authorize'
   import { PropHandler } from './cream/interface'
   
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
       plugins: [auth.interceptor.bind(auth)], // 请求插槽
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

   