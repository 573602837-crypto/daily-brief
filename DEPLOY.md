# 公网部署指南

这个项目现在是一个 `Next.js + Prisma + PostgreSQL + Vercel Cron` 网站。

如果你想让“其他设备也能访问”，就必须把它部署到公网，而不是只在本机运行 `npm run dev`。

## 你现在为什么只能本机打开

你当前打开的是：

- `http://localhost:3000`

`localhost` 只代表你自己的电脑，所以别的电脑和手机默认访问不到。

## 最短上线路径

推荐组合：

- 网站托管：Vercel
- 数据库：Neon Postgres
- 定时更新：Vercel Cron

部署完成后，你会得到一个公网地址，例如：

- `https://your-project.vercel.app`

这时：

- 你的电脑可以访问
- 你的手机可以访问
- 其他设备也可以访问
- 每天自动生成日报

## 需要准备的账号

1. GitHub 账号
2. Vercel 账号
3. Neon 账号

## 第一步：把代码推到 GitHub

如果项目还没推到 GitHub，先创建一个仓库，再把当前项目推上去。

## 第二步：创建 Neon 数据库

1. 登录 Neon
2. 新建一个 Project
3. 在项目里点击 `Connect`
4. 复制连接字符串

连接字符串看起来像这样：

```env
postgresql://USER:PASSWORD@HOST/dbname?sslmode=require
```

把它记作：

- `DATABASE_URL`

参考：

- [Neon: Connect Neon](https://neon.com/docs/get-started-with-neon/connect-neon)
- [Neon: Prisma migrations](https://neon.com/docs/guides/prisma-migrations?a=aabdcc0d-1097-4074-abb5-e3f31b8e8faa)

## 第三步：在 Vercel 导入项目

1. 登录 Vercel
2. 点击 `Add New Project`
3. 选择你的 GitHub 仓库
4. Vercel 会自动识别 Next.js 项目
5. 先不要急着部署，先配置环境变量

参考：

- [Vercel: Deploying to Vercel](https://vercel.com/docs/deployments)
- [Vercel: Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)

## 第四步：配置环境变量

在 Vercel 项目设置里添加这些变量：

```env
DATABASE_URL=你的 Neon 连接字符串
CRON_SECRET=一串随机长字符串
SITE_URL=https://你的线上域名
BRIEF_TIMEZONE=Asia/Shanghai
DEFAULT_BRIEF_HOUR=7
```

说明：

- `DATABASE_URL`：数据库连接
- `CRON_SECRET`：保护定时任务接口
- `SITE_URL`：线上网址
- `BRIEF_TIMEZONE`：日报时区
- `DEFAULT_BRIEF_HOUR`：默认展示时间

参考：

- [Vercel: Environment variables](https://vercel.com/docs/environment-variables)

## 第五步：初始化数据库

项目第一次上线前，需要把 Prisma 表结构推到数据库。

你可以在本地执行：

```bash
cd /Users/chenzhixiang/Desktop/codex
DATABASE_URL="你的数据库连接串" npm run db:push
```

如果你已经在本地 `.env` 写好了 `DATABASE_URL`，也可以直接：

```bash
npm run db:push
```

## 第六步：部署到 Vercel

完成环境变量后，回到 Vercel 点击 Deploy。

部署成功后，Vercel 会给你一个公网 URL。

## 第七步：验证定时任务

本项目已经有：

- [vercel.json](/Users/chenzhixiang/Desktop/codex/vercel.json)

里面配置了每天一次的 Cron：

- `/api/cron/daily`

当前设置是每天北京时间早上 7 点附近触发，对应 UTC `23:00`。

Vercel 官方说明：

- Cron Jobs 在所有计划可用
- Hobby 计划支持“每天一次”这种频率

参考：

- [Vercel: Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Vercel: Cron pricing and limits](https://vercel.com/docs/cron-jobs/usage-and-pricing)

## 第八步：手动生成第一份日报

上线后，建议先手动触发一次：

```bash
curl -X POST https://你的域名/api/cron/daily \
  -H "Authorization: Bearer 你的CRON_SECRET"
```

这样首页就会立刻出现日报，而不用等到第二天早上。

## 你现在能得到什么

完成以上步骤后：

- 网站可以在其他设备上访问
- 手机浏览器可以直接打开
- 每天自动更新日报
- 数据库存储会长期保留

## 一个重要提醒

当前项目还没有“用户账号登录系统”。

现在支持的是：

- 其他设备访问网站

现在还不支持的是：

- 用户注册
- 用户登录
- 权限控制

如果你说的“登录这个网站”是指“账号登录”，那需要额外加一套认证系统，比如：

- NextAuth/Auth.js
- 邮箱登录
- GitHub/Google 登录
- 管理员后台

如果你只是想“让其他设备打开这个网站”，那本次部署就已经足够。
