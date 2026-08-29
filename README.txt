# UptimeRobot自定义状态页项目

项目用途：使用EdgeOne Makers托管公开状态页，服务端函数通过环境变量读取UptimeRobot API密钥，浏览器永远不会接触密钥。

目录：
index.html：公开展示页面
functions/status.js：状态接口，路径为/api/status
package.json：项目说明

部署前必须设置环境变量：
UPTIMEROBOT_API_KEY

不要把真实密钥写入index.html、status.js、package.json、Git仓库或前端JavaScript。

UptimeRobot监控器建议使用以下友好名称：
QQ官机平台
CPA接口服务
GPT2接口服务
图片服务
Webhook服务

接口只返回服务名称、状态、响应时间、30天可用率和更新时间，不返回监控器内部ID、服务器IP、原始URL或API密钥。

注意：EdgeOne Makers的具体函数入口和环境变量配置界面以控制台当前版本为准。如果控制台不支持functions/status.js这种目录约定，需要在Makers中选择边缘函数模板，并将该文件内容粘贴为/api/status函数。
