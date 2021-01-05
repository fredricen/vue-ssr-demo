import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)
//每次用户请求，都需要创建一个router实例
export default function createRouter(){
    return new Router({
        mode:'history',
        routes:[
            {path:'/',component:()=>import('@/components/Home')},
            {path:'/detail',component:()=>import('@/components/Detail')}
        ]
    })
}