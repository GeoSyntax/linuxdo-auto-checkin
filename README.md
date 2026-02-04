# 🐧 Linux.do 每日自动签到

<p align="center">
  <img src="https://linux.do/uploads/default/optimized/1X/3a18b4c59d8fcc5b52c3ce2bdc78249743dfcc75_2_180x180.png" width="100" alt="Linux.do Logo">
</p>

<p align="center">
  <a href="https://github.com/GeoSyntax/linuxdo-auto-checkin"><img src="https://img.shields.io/github/stars/GeoSyntax/linuxdo-auto-checkin?style=flat-square" alt="Stars"></a>
  <a href="https://greasyfork.org/zh-CN/scripts/linuxdo-auto-checkin"><img src="https://img.shields.io/badge/GreasyFork-安装-red?style=flat-square" alt="GreasyFork"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/GeoSyntax/linuxdo-auto-checkin?style=flat-square" alt="License"></a>
</p>

一个用于 [Linux.do](https://linux.do/) 论坛的每日自动签到油猴脚本。在你浏览常用网站时，自动在后台完成签到，轻松获取每日 **+10 积分**。

## ✨ 功能特性

| 功能 | 描述 |
|------|------|
| 🔄 **自动签到** | 访问常用网站时自动在后台完成签到 |
| 🎛️ **控制面板** | 精美的悬浮控制面板，实时查看签到状态 |
| 📊 **状态监控** | 显示签到状态、登录状态、脚本运行状态 |
| 📝 **运行日志** | 记录每次运行的详细日志 |
| 🔔 **通知提醒** | 签到成功后弹出系统通知和页面提示 |
| ⚙️ **灵活配置** | 支持隐藏/显示悬浮按钮 |
| 🛡️ **智能防重复** | 已签到后不会重复请求，节省资源 |
| 🌐 **代理友好** | 网络失败不会误记录，下次自动重试 |

## 📸 截图预览

### 悬浮按钮
右下角的企鹅图标，绿点表示今日已签到，黄点表示未签到。

### 控制面板
点击悬浮按钮展开完整控制面板：
- 📊 运行状态：签到状态、登录状态、脚本状态、上次检查时间
- ⚡ 快捷操作：立即签到、检测状态、访问论坛
- ⚙️ 设置：显示/隐藏悬浮按钮
- 📝 运行日志：查看详细运行记录

## 📦 安装方法

### 前置要求
请先安装以下任意一个用户脚本管理器：
- [Tampermonkey](https://www.tampermonkey.net/) (推荐)
- [Violentmonkey](https://violentmonkey.github.io/)
- [Greasemonkey](https://www.greasespot.net/)

### 安装脚本

#### 方式一：从 Greasy Fork 安装（推荐）
[![安装脚本](https://img.shields.io/badge/Greasy%20Fork-安装脚本-red?style=for-the-badge)](https://greasyfork.org/zh-CN/scripts/linuxdo-auto-checkin)

点击上方按钮，然后点击「安装此脚本」即可。

#### 方式二：从 GitHub 安装
1. 点击 [linuxdo-auto-checkin.user.js](./linuxdo-auto-checkin.user.js)
2. 点击「Raw」按钮
3. 脚本管理器会自动弹出安装提示

#### 方式三：手动安装
1. 复制 `linuxdo-auto-checkin.user.js` 的全部内容
2. 打开 Tampermonkey → 添加新脚本
3. 粘贴代码并保存

## 🚀 使用方法

### 首次使用
1. **安装脚本后**，先手动访问 [linux.do](https://linux.do/) 并登录
2. 确保浏览器保存了登录状态（Cookie）
3. 之后正常浏览网页即可，脚本会自动工作

### 日常使用
只需正常上网！当你访问以下网站时，脚本会自动在后台完成签到：
- Google / Google HK
- 百度
- GitHub
- B站
- 知乎
- Linux.do / Connect

### 查看状态
- **点击右下角 🐧 图标**：打开控制面板
- **油猴菜单**：点击浏览器工具栏的 Tampermonkey 图标查看更多选项

## 📋 油猴菜单

| 菜单项 | 功能 |
|--------|------|
| 🎛️ 打开控制面板 | 打开完整控制面板（即使隐藏了悬浮按钮） |
| 🔄 手动签到 | 强制执行一次签到 |
| 🔍 检测连接状态 | 检查与 Linux.do 的连接和登录状态 |
| 📊 查看签到状态 | 弹窗显示详细状态信息 |
| 👁️ 显示/隐藏悬浮按钮 | 切换悬浮按钮的显示状态 |
| 🗑️ 重置签到状态 | 清除签到记录（调试用） |
| 📝 清空运行日志 | 清除所有运行日志 |

## ❓ 常见问题

### Q: 为什么显示"未登录"？
A: 请先手动访问 [linux.do](https://linux.do/) 并登录，确保浏览器保存了 Cookie。

### Q: 需要代理才能访问 Linux.do，脚本能用吗？
A: 可以。脚本使用 `GM_xmlhttpRequest` 发起请求，会自动使用浏览器的代理设置。如果请求失败，不会错误记录签到状态，下次会自动重试。

### Q: 签到后积分什么时候到账？
A: 根据 Linux.do 规则，积分会在每日 0 点自动结转到 Connect 站。

### Q: 可以添加其他触发网站吗？
A: 可以。编辑脚本头部的 `@match` 规则，添加你常用的网站即可。例如：
```javascript
// @match        https://www.youtube.com/*
```

### Q: 悬浮按钮挡到页面了怎么办？
A: 点击悬浮按钮打开面板 → 在「设置」区域关闭「显示悬浮按钮」，或者通过油猴菜单隐藏。

### Q: 脚本会重复签到浪费资源吗？
A: 不会。脚本会在本地记录签到日期，已签到后不会再发起请求。

## 🔧 高级配置

编辑脚本中的 `CONFIG` 对象可以自定义行为：

```javascript
const CONFIG = {
  ENABLE_NOTIFICATION: true,  // 是否启用系统通知
  ENABLE_TOAST: true,         // 是否启用页面内提示
  TOAST_DURATION: 4000,       // 提示显示时长（毫秒）
  DEBUG_MODE: false,          // 调试模式
  MAX_LOG_ENTRIES: 20,        // 最大日志条数
};
```

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## ⚠️ 免责声明

- 本脚本仅用于学习和个人使用
- 请遵守 Linux.do 社区规则
- 使用本脚本产生的任何后果由用户自行承担

## 📝 更新日志

### v2.0 (2024-02-04)
- ✨ 新增完整控制面板
- ✨ 新增运行日志功能
- ✨ 新增悬浮按钮显示/隐藏开关
- ✨ 新增连接状态检测
- 🐛 修复重复签到问题
- 🐛 修复代理环境下的错误处理

### v1.0
- 🎉 首次发布
- ✨ 基础自动签到功能
- ✨ 系统通知和页面提示

---

<p align="center">
  Made with ❤️ for <a href="https://linux.do/">Linux.do</a> Community
</p>
