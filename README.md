# 实现vue ssr具体过程



## 概念

将一个Vue组件在服务器端渲染为HTML字符串并发送到浏览器，最后将这些静态标记”激活“为可交互应用的过程。

## 创建工程 vue-cli

`vue create ssr`



## 安装依赖

1. 渲染器 vue-server-renderer
2. nodejs服务器 express

```
npm i vue-server-renderer express -D
```



## 编写服务端启动脚本

1. 新建server文件夹
2. 新建/server/index.js文件

```javascript
//nodejs服务器
const express = require('express')
const Vue = require('vue')

//创建express实例
const app = express()
//创建渲染器
const renderer = require('vue-server-renderer').createRenderer()

//将来用渲染器渲染page可以得到html内容
const page = new Vue({
    data:{title:'标题'},
    template:"<div><h1>{{title}}</h1><div>hello,vue ssr!</div></div>"
})

//路由处理交给express
app.get('/',async (req,res)=>{
    try {
        const html = await renderer.renderToString(page)
        res.send(html)
    } catch (error) {
        res.status(500).send('服务器内部错误')
    }
})

app.listen(3000,()=>{
    console.log('渲染服务器启动成功')
})

```



## 路由

安装vue-router

```bash
npm i vue-router
```

配置

创建./src/router/index.js

> 因为每个请求应该都是全新的、独立的应用程序实例，以便不会有交叉请求造成的状态污染。所里这里导出的是创建Router实例的工厂函数

创建Home.vue，Detail.vue，更新App.vue

## 构建

### 构建流程

![服务端渲染流程](./vue服务端渲染构建.png)

### 代码结构

```
src
├── components
│   ├── Foo.vue
│   ├── Bar.vue
│   └── Baz.vue
├── App.vue
├── app.js # 通用 entry(universal entry)
├── entry-client.js # 仅运行于浏览器，客户端入口
└── entry-server.js # 仅运行于服务器，服务端入口
```



## 通用入口

用于创建Vue实例，创建app.js



## 服务端入口

为每次请求创建单个Vue实例，并处理首屏，创建.src/entry-server.js



## 客户端入口

挂载、激活服务端渲染页面为单页面应用（SPA），创建.src/entry-client.js



## webpack打包

创建vue.config.js,内容如下：

```javascript
const VueSSRServerPlugin = require("vue-server-renderer/server-plugin")
const VueSSRClientPlugin = require("vue-server-renderer/client-plugin")
//环境变量，决定入口是客户端还是服务端
const nodeExternals = require("webpack-node-externals")
const merge = require("lodash.merge")
const TARGET_NODE = process.env.WEBPACK_TARGET === "node"
const target = TARGET_NODE ? "server" : "client"

module.exports = {
    css: {
        extract:false
    },
    outputDir:'./dist/'+target,
    configureWebpack: ()=>({
        //将entry指向应用程序的server/client文件
        entry:`./src/entry-${target}.js`,
        //对bundle renderer提供source map支持
        devtool: 'source-map',
        //这允许webpack以Node适用方式处理动态导入（dynamic import）
        //而且还会在编译Vue组件时告知`vue-loader`输送面向服务器代码（server-oriented code）
        target: TARGET_NODE?'node':'web',
        node:TARGET_NODE?undefined:false,
        output:{
            //此处告知server-bundle使用Node风格导出模块
            libraryTarget: TARGET_NODE?'commonjs2':undefined
        },
        //外置化应用程序依赖模块，可以使服务器构建速度更快，并生成较小的bundle文件
        externals:TARGET_NODE?nodeExternals({
            //不要外置化webpack需要处理的依赖模块
            //可以在这里添加更多的文件类型，例如，未处理*.vue原始文件
            //你还应该将修改`global`（例如polyfill）的依赖模块列入白名单
            whiteList: [/\.css$/]
        }):undefined,
        optimization:{
            splitChunks:undefined
        },
        //这是将服务器的整个输出构建为单个JSON文件的插件
        //服务器默认文件名为`vue-ssr-server-bundle.json`
        plugins:[TARGET_NODE?new VueSSRServerPlugin(): new VueSSRClientPlugin()]
    }),
    chainWebpack: config => {
        config.module
        .rule('vue')
        .use('vue-loader')
        .tap(options=>{
            merge(options,{
                optimizeSSR:false
            })
        })
    }
}
```



## 脚本配置

安装依赖

```bash
npm i cross-env -D
```

定义创建脚本，package.json

```javascript
"script":{
    "build:client": "vue-cli-service build",
    "build:server": "cross-env WEBPACK_TARGET=node vue-cli-service build --mode server",
    "build": "npm run build:server && npm run build:client"
}
```

> 执行打包



## 宿主文件

最后需要定义宿主文件，创建./src/index.template.html



## 服务器启动文件

修改服务器启动文件，所有路由都由vue接管，使用bundle渲染器生成内容，./server/index2.js	

```javascript
//nodejs服务器
const express = require('express')
const fs = require('fs')

//创建express实例
const app = express()
//创建渲染器
const {createBundleRenderer} = require('vue-server-renderer')
const serverBundle = require('../dist/server/vue-ssr-server-bundle.json')
const clientManifest = require('../dist/client/vue-ssr-client-manifest.json')
const renderer = createBundleRenderer(serverBundle,{
    runInNewContext:false,
    template:fs.readFileSync('../public/index.template.html','utf-8'),//宿主模板文件
    clientManifest
})

//中间件处理静态文件请求
app.use(express.static('../dist/client',{index:false}))

//路由处理交给vue
app.get('*',async (req,res)=>{
    try {
        const context = {
            url:req.url,
            title:'ssr test'
        }
        const html = await renderer.renderToString(context)
        res.send(html)
    } catch (error) {
        res.status(500).send('服务器内部错误')
    }
})

app.listen(3000,()=>{
    console.log('渲染服务器启动成功')
})
```

