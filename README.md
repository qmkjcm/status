# QMKJCM Status

倾慕系列服务的公开运行状态页面，部署于腾讯云 EdgeOne Makers，监控数据由 UptimeRobot 提供。

## 当前展示服务

- 倾慕云小窝
- 倾慕公益API
- 倾慕慕官机平台

## 项目结构

```text
index.html                         # 用户可见的状态页面
cloud-functions/api/status.js     # EdgeOne Cloud Function，对应 /api/status
README.md                          # 项目文档
```

## 工作原理

1. 浏览器访问 `index.html`。
2. 页面请求 `/api/status`。
3. EdgeOne Cloud Function 从服务端环境变量读取 UptimeRobot API Key。
4. Cloud Function 请求 UptimeRobot API，并只返回脱敏后的服务名称、状态、响应时间、30 天可用率和更新时间。
5. 浏览器不会接触 UptimeRobot API Key、监控器 ID、服务器 IP 或内部监控 URL。

## EdgeOne 环境变量

在项目设置中添加：

```text
UPTIMEROBOT_API_KEY
```

环境变量只应保存在 EdgeOne 服务端环境中，不要写入 GitHub、HTML 或前端 JavaScript。

## EdgeOne 路由

函数文件：

```text
cloud-functions/api/status.js
```

自动映射为：

```text
/api/status
```

## 部署

项目已关联 GitHub `main` 分支。推送新提交后，EdgeOne Makers 会自动构建并发布。

正式地址：

- 状态页面：<https://status.qmkjcm.cn/>
- 状态接口：<https://status.qmkjcm.cn/api/status>

## 状态含义

- `up`：服务正常
- `warn`：服务性能下降或状态待确认
- `down`：服务中断

## 安全说明

公开接口不会返回：

- UptimeRobot API Key
- 腾讯云 API Token
- GitHub Token
- UptimeRobot 监控器 ID
- 服务器真实 IP
- 完整内部监控 URL

## 技术栈

- 静态 HTML / CSS / JavaScript
- EdgeOne Makers Cloud Functions
- UptimeRobot API v2
