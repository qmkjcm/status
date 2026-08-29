# QMKJCM 自定义状态页

这个项目用于EdgeOne Makers，使用静态页面加Edge Functions展示UptimeRobot监控状态。

目录结构：
index.html
edge-functions/api/status.js
README.txt

EdgeOne Makers函数路由：
edge-functions/api/status.js 会自动对应 /api/status

部署前请在EdgeOne Makers项目环境变量中设置：
UPTIMEROBOT_API_KEY

API密钥只应配置在EdgeOne服务端环境变量中，不要写入HTML、JavaScript前端代码、GitHub仓库或README。

页面只公开返回服务名称、状态、响应时间、30天可用率和更新时间，不返回UptimeRobot API密钥、监控器ID、服务器IP或完整内部监控URL。

UptimeRobot监控器建议名称：
QQ官机平台
CPA接口服务
GPT2接口服务
图片服务
Webhook服务
