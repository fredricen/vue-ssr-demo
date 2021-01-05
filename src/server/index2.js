//nodejs服务器
const express = require('express')
const fs = require('fs')
const path = require('path')

//创建express实例
const app = express()
//创建渲染器
const {createBundleRenderer} = require('vue-server-renderer')

/* require可以使用相对路径，也可以使用绝对路径，以下两种方式都是有效的 */
// const serverBundlePath = path.resolve(__dirname,'../../dist/server/vue-ssr-server-bundle.json')
// const serverBundle = require(serverBundlePath)
const serverBundle = require('../../dist/server/vue-ssr-server-bundle.json')
const clientManifestPath = path.resolve(__dirname,'../../dist/client/vue-ssr-client-manifest.json')
const clientManifest = require(clientManifestPath)
//const clientManifest = require('../../dist/client/vue-ssr-client-manifest.json')

/* 以下两个都是有效的 */
//const templatePath = path.resolve(__dirname,'../../public/index.template.html')
//const templatePath = path.join(__dirname,'../../public/index.template.html')
/* readFileSync读取文件目录默认是从项目的根目录开始的 */
const templatePath = './public/index.template.html'
const renderer = createBundleRenderer(serverBundle,{
    runInNewContext:false,
    template:fs.readFileSync(templatePath,'utf-8'),//宿主模板文件
    clientManifest
})

//中间件处理静态文件请求
app.use(express.static('../../dist/client',{index:false}))

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
