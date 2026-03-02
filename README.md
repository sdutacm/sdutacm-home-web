# sdutacm-home-web (SDUTACM 2.0)

> SDUTACM 官网及其管理系统，项目根据 SDUTACM 旧版官网重构。
> 
> 旧版官网仓库地址：https://github.com/sdutacm/oj-competition-side-client

## 技术栈

### 后端
- [bwcx](https://bwcxjs.github.io/bwcx/) - 基于 Koa 的全栈框架
- TypeScript
- TypeORM + MySQL
- PM2 进程管理

### 前端
- Vue 3 (Class Component)
- Vite
- Element Plus
- ECharts
- Quill 富文本编辑器

### 其他
- SSR 服务端渲染 (vite-ssr)
- Docker 容器化部署

## 功能特性

- **服务端渲染（SSR）**：首页、新闻列表等页面支持 SSR，提升 SEO 和首屏加载速度
- **后台管理系统**：完整的 CMS 管理功能
  - 新闻管理（新闻分类、发布、编辑、预览）
  - 项目管理
  - 媒体资源管理（图片、音频、视频）
  - 全局配置管理
  - 用户管理
- **大文件分片上传**：支持最大 500MB 音视频文件上传
- **审计日志与版本控制**：记录所有管理员操作，支持数据版本对比和回滚
- **访问统计**：页面访问量统计与分析

## 项目结构

```
├── src/
│   ├── client/          # 前端代码
│   │   ├── modules/     # 页面模块
│   │   │   ├── home/    # 首页
│   │   │   ├── news/    # 新闻
│   │   │   ├── admin/   # 管理后台
│   │   │   └── ...
│   │   ├── components/  # 通用组件
│   │   ├── api/         # API 客户端
│   │   └── router/      # 路由配置
│   ├── server/          # 后端代码
│   │   ├── modules/     # 业务模块
│   │   │   ├── auth/    # 认证
│   │   │   ├── news/    # 新闻
│   │   │   ├── media/   # 媒体
│   │   │   ├── project/ # 项目
│   │   │   ├── audit/   # 审计
│   │   │   ├── stats/   # 统计
│   │   │   └── ...
│   │   ├── db/          # 数据库
│   │   │   ├── entity/  # 实体定义
│   │   │   └── seeds/   # 种子数据
│   │   └── guards/      # 权限守卫
│   └── common/          # 前后端共享代码
│       ├── modules/     # 共享模块（DTO、RO 等）
│       └── enums/       # 枚举定义
├── public/              # 静态资源
├── docs/                # 技术文档
├── scripts/             # 脚本工具
└── app/                 # 编译输出（服务端）
```

## 环境要求

- Node.js >= 16
- pnpm >= 8
- MySQL >= 5.7

## 快速开始

### 1. 安装依赖

```bash
pnpm install
# 或
npm run init
```

### 2. 配置数据库

修改 `src/server/db/index.ts` 中的数据库连接配置：

```typescript
const appDataSource = new DataSource({
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  username: 'your_username',
  password: 'your_password',
  database: 'sdutacm-home-web',
  // ...
});
```

### 3. 初始化数据（可选）

```bash
pnpm run seed
```

### 4. 启动开发服务器

```bash
pnpm run dev
```

开发服务器将在 `http://127.0.0.1:3000` 启动。

## 构建与部署

### 本地构建

```bash
# 构建前端和后端
pnpm run build

# 启动生产服务
pnpm run start
```

### PM2 部署

```bash
pnpm run deploy
```

### Docker 部署

```bash
# 构建镜像
docker build -t sdutacm-home-web .

# 运行容器
docker run -d -p 3000:3000 sdutacm-home-web
```

## 可用脚本

| 命令 | 说明 |
|------|------|
| `pnpm run dev` | 启动开发服务器 |
| `pnpm run build` | 构建生产版本 |
| `pnpm run start` | 启动生产服务 |
| `pnpm run deploy` | PM2 集群部署 |
| `pnpm run seed` | 运行数据库种子 |
| `pnpm run gen:client-router` | 生成前端路由 |

## 相关链接

- [bwcx 框架官网](https://bwcxjs.github.io/bwcx/)
- [Vue 3 文档](https://vuejs.org/)
- [Element Plus 文档](https://element-plus.org/)
- [TypeORM 文档](https://typeorm.io/)

## License

MIT
