// ==UserScript==
// @name         Linux.do 每日自动签到
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  每天自动访问一次 linux.do 以获取 +10 积分。在常用网站静默运行，支持签到状态检测和通知提醒，带有完整的控制面板。
// @author       LinuxDo User
// @match        https://www.google.com/*
// @match        https://www.google.com.hk/*
// @match        https://www.baidu.com/*
// @match        https://github.com/*
// @match        https://www.bilibili.com/*
// @match        https://www.zhihu.com/*
// @match        https://linux.do/*
// @match        https://connect.linux.do/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @connect      linux.do
// @run-at       document-idle
// @icon         https://linux.do/uploads/default/optimized/1X/3a18b4c59d8fcc5b52c3ce2bdc78249743dfcc75_2_180x180.png
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  // ==================== 配置区 ====================
  const CONFIG = {
    TARGET_URL: "https://linux.do/",
    CHECKIN_KEY: "linuxdo_last_checkin_date",
    CHECKIN_TIME_KEY: "linuxdo_last_checkin_time",
    SCRIPT_STATUS_KEY: "linuxdo_script_status",
    LOGIN_STATUS_KEY: "linuxdo_login_status",
    LAST_CHECK_KEY: "linuxdo_last_check_time",
    RUN_LOG_KEY: "linuxdo_run_log",
    FLOATING_BTN_VISIBLE_KEY: "linuxdo_floating_btn_visible", // 悬浮按钮是否显示
    ENABLE_NOTIFICATION: true, // 是否启用系统通知
    ENABLE_TOAST: true, // 是否启用页面内提示
    TOAST_DURATION: 4000, // 提示显示时长（毫秒）
    DEBUG_MODE: false, // 调试模式
    LOG_PREFIX: "🐧 [Linux.do Auto]",
    MAX_LOG_ENTRIES: 20, // 最大日志条数
  };

  // 检查今日是否已签到（防止重复请求）
  function isCheckedInToday() {
    const today = getTodayString();
    const lastCheckin = GM_getValue(CONFIG.CHECKIN_KEY, "");
    return lastCheckin === today;
  }

  // 获取悬浮按钮显示状态
  function isFloatingBtnVisible() {
    return GM_getValue(CONFIG.FLOATING_BTN_VISIBLE_KEY, true);
  }

  // 设置悬浮按钮显示状态
  function setFloatingBtnVisible(visible) {
    GM_setValue(CONFIG.FLOATING_BTN_VISIBLE_KEY, visible);
  }

  // ==================== 工具函数 ====================

  // 获取当前日期字符串 (YYYY-MM-DD)
  function getTodayString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // 获取当前时间字符串 (HH:MM:SS)
  function getTimeString() {
    const date = new Date();
    return date.toLocaleTimeString("zh-CN", { hour12: false });
  }

  // 日志输出
  function log(message, type = "info") {
    const styles = {
      info: "color: #17a2b8",
      success: "color: #28a745",
      warning: "color: #ffc107",
      error: "color: #dc3545",
    };
    console.log(
      `%c${CONFIG.LOG_PREFIX} ${message}`,
      styles[type] || styles.info,
    );
    // 同时保存到运行日志
    addRunLog(message, type);
  }

  // 添加运行日志
  function addRunLog(message, type = "info") {
    const logs = GM_getValue(CONFIG.RUN_LOG_KEY, []);
    const logEntry = {
      time: new Date().toLocaleString("zh-CN"),
      message: message,
      type: type,
      site: location.hostname,
    };
    logs.unshift(logEntry);
    // 只保留最近的日志
    if (logs.length > CONFIG.MAX_LOG_ENTRIES) {
      logs.length = CONFIG.MAX_LOG_ENTRIES;
    }
    GM_setValue(CONFIG.RUN_LOG_KEY, logs);
  }

  // 获取运行日志
  function getRunLogs() {
    return GM_getValue(CONFIG.RUN_LOG_KEY, []);
  }

  // 清空运行日志
  function clearRunLogs() {
    GM_setValue(CONFIG.RUN_LOG_KEY, []);
  }

  // 更新脚本状态
  function updateScriptStatus(status, loginStatus = null) {
    GM_setValue(CONFIG.SCRIPT_STATUS_KEY, {
      status: status,
      lastUpdate: new Date().toLocaleString("zh-CN"),
    });
    if (loginStatus !== null) {
      GM_setValue(CONFIG.LOGIN_STATUS_KEY, loginStatus);
    }
    GM_setValue(CONFIG.LAST_CHECK_KEY, new Date().toLocaleString("zh-CN"));
  }

  // 获取脚本状态信息
  function getScriptStatusInfo() {
    const scriptStatus = GM_getValue(CONFIG.SCRIPT_STATUS_KEY, {
      status: "unknown",
      lastUpdate: "从未",
    });
    const loginStatus = GM_getValue(CONFIG.LOGIN_STATUS_KEY, "unknown");
    const lastCheck = GM_getValue(CONFIG.LAST_CHECK_KEY, "从未");
    const lastCheckinDate = GM_getValue(CONFIG.CHECKIN_KEY, "");
    const lastCheckinTime = GM_getValue(CONFIG.CHECKIN_TIME_KEY, "");
    const today = getTodayString();

    return {
      scriptStatus: scriptStatus.status,
      scriptLastUpdate: scriptStatus.lastUpdate,
      loginStatus: loginStatus,
      lastCheck: lastCheck,
      isCheckedInToday: lastCheckinDate === today,
      lastCheckinDate: lastCheckinDate || "从未",
      lastCheckinTime: lastCheckinTime || "",
    };
  }

  // ==================== UI 组件 ====================

  // 页面内 Toast 提示
  function showToast(msg, type = "success") {
    if (!CONFIG.ENABLE_TOAST) return;

    const colors = {
      success: { bg: "#28a745", icon: "✅" },
      info: { bg: "#17a2b8", icon: "ℹ️" },
      warning: { bg: "#ffc107", icon: "⚠️" },
      error: { bg: "#dc3545", icon: "❌" },
    };

    const style = colors[type] || colors.success;

    const div = document.createElement("div");
    div.className = "linuxdo-auto-toast";
    div.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${style.bg};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 999999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
        `;

    // 添加动画样式
    if (!document.querySelector("#linuxdo-auto-style")) {
      const styleEl = document.createElement("style");
      styleEl.id = "linuxdo-auto-style";
      styleEl.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
      document.head.appendChild(styleEl);
    }

    div.innerHTML = `<span style="font-size: 16px;">${style.icon}</span><span>${msg}</span>`;
    document.body.appendChild(div);

    setTimeout(() => {
      div.style.animation = "slideOut 0.3s ease-out forwards";
      setTimeout(() => div.remove(), 300);
    }, CONFIG.TOAST_DURATION);
  }

  // 系统通知
  function showNotification(title, text) {
    if (!CONFIG.ENABLE_NOTIFICATION) return;

    try {
      GM_notification({
        title: title,
        text: text,
        timeout: 5000,
        image:
          "https://linux.do/uploads/default/optimized/1X/3a18b4c59d8fcc5b52c3ce2bdc78249743dfcc75_2_180x180.png",
      });
    } catch (e) {
      log("通知发送失败: " + e.message, "warning");
    }
  }

  // ==================== 签到状态面板 ====================

  // 注入全局样式
  function injectGlobalStyles() {
    if (document.querySelector("#linuxdo-auto-global-style")) return;

    const styleEl = document.createElement("style");
    styleEl.id = "linuxdo-auto-global-style";
    styleEl.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .linuxdo-panel-btn {
        transition: all 0.2s ease;
      }
      .linuxdo-panel-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
      }
      .linuxdo-panel-btn:active {
        transform: translateY(0);
      }
      .linuxdo-log-item {
        padding: 8px 10px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        font-size: 11px;
        line-height: 1.4;
      }
      .linuxdo-log-item:last-child {
        border-bottom: none;
      }
      .linuxdo-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 6px;
      }
      .linuxdo-status-dot.success { background: #28a745; box-shadow: 0 0 6px #28a745; }
      .linuxdo-status-dot.warning { background: #ffc107; box-shadow: 0 0 6px #ffc107; }
      .linuxdo-status-dot.error { background: #dc3545; box-shadow: 0 0 6px #dc3545; }
      .linuxdo-status-dot.info { background: #17a2b8; box-shadow: 0 0 6px #17a2b8; }
      .linuxdo-status-dot.unknown { background: #6c757d; }
    `;
    document.head.appendChild(styleEl);
  }

  // 创建悬浮图标按钮
  function createFloatingButton() {
    // 如果用户选择隐藏悬浮按钮，则不创建
    if (!isFloatingBtnVisible()) {
      return;
    }

    injectGlobalStyles();

    const existingBtn = document.querySelector("#linuxdo-floating-btn");
    if (existingBtn) existingBtn.remove();

    const statusInfo = getScriptStatusInfo();
    const statusColor = statusInfo.isCheckedInToday ? "#28a745" : "#ffc107";

    const btn = document.createElement("div");
    btn.id = "linuxdo-floating-btn";
    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      cursor: pointer;
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      user-select: none;
    `;

    btn.innerHTML = `
      <span style="font-size: 24px;">🐧</span>
      <span style="
        position: absolute;
        top: -2px;
        right: -2px;
        width: 14px;
        height: 14px;
        background: ${statusColor};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 6px ${statusColor};
      "></span>
    `;

    btn.addEventListener("mouseenter", () => {
      btn.style.transform = "scale(1.1)";
      btn.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "scale(1)";
      btn.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
    });

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleControlPanel();
    });

    document.body.appendChild(btn);
  }

  // 创建完整控制面板
  function createControlPanel() {
    injectGlobalStyles();

    const existingPanel = document.querySelector("#linuxdo-control-panel");
    if (existingPanel) existingPanel.remove();

    const statusInfo = getScriptStatusInfo();
    const logs = getRunLogs().slice(0, 10);

    const panel = document.createElement("div");
    panel.id = "linuxdo-control-panel";
    panel.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 340px;
      max-height: 500px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
      border-radius: 16px;
      z-index: 999999;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      animation: fadeIn 0.3s ease-out;
    `;

    // 获取状态显示信息
    const getStatusDisplay = (status) => {
      const statusMap = {
        running: { text: "运行中", class: "success" },
        success: { text: "签到成功", class: "success" },
        not_logged_in: { text: "未登录", class: "warning" },
        error: { text: "出错", class: "error" },
        unknown: { text: "未知", class: "unknown" },
      };
      return statusMap[status] || statusMap["unknown"];
    };

    const getLoginStatusDisplay = (status) => {
      const statusMap = {
        logged_in: { text: "已登录", class: "success" },
        not_logged_in: { text: "未登录", class: "warning" },
        unknown: { text: "未检测", class: "unknown" },
      };
      return statusMap[status] || statusMap["unknown"];
    };

    const scriptStatusDisplay = getStatusDisplay(statusInfo.scriptStatus);
    const loginStatusDisplay = getLoginStatusDisplay(statusInfo.loginStatus);

    panel.innerHTML = `
      <!-- 头部 -->
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 28px;">🐧</span>
          <div>
            <div style="font-weight: bold; font-size: 16px;">Linux.do 签到助手</div>
            <div style="font-size: 11px; opacity: 0.8;">v2.0 · 自动签到脚本</div>
          </div>
        </div>
        <button id="linuxdo-panel-close" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        ">✕</button>
      </div>

      <!-- 状态区域 -->
      <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div style="font-size: 12px; color: #aaa; margin-bottom: 12px;">📊 运行状态</div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <!-- 签到状态 -->
          <div style="
            background: rgba(255,255,255,0.05);
            padding: 12px;
            border-radius: 10px;
          ">
            <div style="font-size: 11px; color: #888; margin-bottom: 6px;">今日签到</div>
            <div style="display: flex; align-items: center;">
              <span class="linuxdo-status-dot ${statusInfo.isCheckedInToday ? "success" : "warning"}"></span>
              <span style="font-size: 14px; font-weight: 500;">${statusInfo.isCheckedInToday ? "已完成" : "未完成"}</span>
            </div>
            ${statusInfo.isCheckedInToday ? `<div style="font-size: 10px; color: #666; margin-top: 4px;">${statusInfo.lastCheckinTime}</div>` : ""}
          </div>

          <!-- 登录状态 -->
          <div style="
            background: rgba(255,255,255,0.05);
            padding: 12px;
            border-radius: 10px;
          ">
            <div style="font-size: 11px; color: #888; margin-bottom: 6px;">登录状态</div>
            <div style="display: flex; align-items: center;">
              <span class="linuxdo-status-dot ${loginStatusDisplay.class}"></span>
              <span style="font-size: 14px; font-weight: 500;">${loginStatusDisplay.text}</span>
            </div>
          </div>

          <!-- 脚本状态 -->
          <div style="
            background: rgba(255,255,255,0.05);
            padding: 12px;
            border-radius: 10px;
          ">
            <div style="font-size: 11px; color: #888; margin-bottom: 6px;">脚本状态</div>
            <div style="display: flex; align-items: center;">
              <span class="linuxdo-status-dot ${scriptStatusDisplay.class}"></span>
              <span style="font-size: 14px; font-weight: 500;">${scriptStatusDisplay.text}</span>
            </div>
          </div>

          <!-- 上次检查 -->
          <div style="
            background: rgba(255,255,255,0.05);
            padding: 12px;
            border-radius: 10px;
          ">
            <div style="font-size: 11px; color: #888; margin-bottom: 6px;">上次检查</div>
            <div style="font-size: 12px; font-weight: 500; word-break: break-all;">${statusInfo.lastCheck}</div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div style="font-size: 12px; color: #aaa; margin-bottom: 12px;">⚡ 快捷操作</div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button id="linuxdo-btn-checkin" class="linuxdo-panel-btn" style="
            flex: 1;
            min-width: 90px;
            padding: 10px 16px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          ">
            <span>🔄</span> 立即签到
          </button>
          <button id="linuxdo-btn-test" class="linuxdo-panel-btn" style="
            flex: 1;
            min-width: 90px;
            padding: 10px 16px;
            background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          ">
            <span>🔍</span> 检测状态
          </button>
          <button id="linuxdo-btn-goto" class="linuxdo-panel-btn" style="
            flex: 1;
            min-width: 90px;
            padding: 10px 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          ">
            <span>🌐</span> 访问论坛
          </button>
        </div>
      </div>

      <!-- 设置区域 -->
      <div style="padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div style="font-size: 12px; color: #aaa; margin-bottom: 10px;">⚙️ 设置</div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 12px; color: #ddd;">显示悬浮按钮</span>
          <label style="position: relative; display: inline-block; width: 44px; height: 24px;">
            <input type="checkbox" id="linuxdo-toggle-btn" ${isFloatingBtnVisible() ? "checked" : ""} style="opacity: 0; width: 0; height: 0;">
            <span style="
              position: absolute;
              cursor: pointer;
              top: 0; left: 0; right: 0; bottom: 0;
              background-color: ${isFloatingBtnVisible() ? "#28a745" : "#ccc"};
              transition: 0.3s;
              border-radius: 24px;
            "></span>
            <span style="
              position: absolute;
              content: '';
              height: 18px;
              width: 18px;
              left: ${isFloatingBtnVisible() ? "23px" : "3px"};
              bottom: 3px;
              background-color: white;
              transition: 0.3s;
              border-radius: 50%;
            "></span>
          </label>
        </div>
        <div style="font-size: 10px; color: #666; margin-top: 6px;">隐藏后可通过油猴菜单打开面板</div>
      </div>

      <!-- 运行日志 -->
      <div style="padding: 16px 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 12px; color: #aaa;">📝 运行日志</span>
          <button id="linuxdo-btn-clear-log" style="
            background: rgba(255,255,255,0.1);
            border: none;
            color: #aaa;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            cursor: pointer;
            transition: all 0.2s;
          ">清空日志</button>
        </div>
        <div id="linuxdo-log-container" style="
          background: rgba(0,0,0,0.3);
          border-radius: 8px;
          max-height: 150px;
          overflow-y: auto;
        ">
          ${
            logs.length > 0
              ? logs
                  .map(
                    (log) => `
            <div class="linuxdo-log-item">
              <span class="linuxdo-status-dot ${log.type}"></span>
              <span style="color: #888; margin-right: 6px;">[${log.time.split(" ")[1] || log.time}]</span>
              <span style="color: #ddd;">${log.message}</span>
            </div>
          `,
                  )
                  .join("")
              : `
            <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
              暂无运行日志
            </div>
          `
          }
        </div>
      </div>

      <!-- 底部信息 -->
      <div style="
        padding: 12px 20px;
        background: rgba(0,0,0,0.2);
        font-size: 10px;
        color: #666;
        text-align: center;
      ">
        当前站点: ${location.hostname} · 今日日期: ${getTodayString()}
      </div>
    `;

    document.body.appendChild(panel);

    // 绑定事件
    document
      .querySelector("#linuxdo-panel-close")
      .addEventListener("click", () => {
        toggleControlPanel(false);
      });

    document
      .querySelector("#linuxdo-btn-checkin")
      .addEventListener("click", async () => {
        const btn = document.querySelector("#linuxdo-btn-checkin");
        btn.innerHTML =
          '<span style="animation: spin 1s linear infinite; display: inline-block;">⏳</span> 签到中...';
        btn.disabled = true;

        try {
          const result = await performCheckin();
          if (result.success) {
            showToast(`🎉 签到成功！时间: ${result.time}`, "success");
            refreshPanel();
          } else {
            showToast("⚠️ 未检测到登录状态，请先登录", "warning");
          }
        } catch (e) {
          showToast("❌ 签到失败: " + e.message, "error");
        }

        btn.innerHTML = "<span>🔄</span> 立即签到";
        btn.disabled = false;
      });

    document
      .querySelector("#linuxdo-btn-test")
      .addEventListener("click", async () => {
        const btn = document.querySelector("#linuxdo-btn-test");
        btn.innerHTML =
          '<span style="animation: spin 1s linear infinite; display: inline-block;">⏳</span> 检测中...';
        btn.disabled = true;

        try {
          await testConnection();
          refreshPanel();
        } catch (e) {
          showToast("❌ 检测失败: " + e.message, "error");
        }

        btn.innerHTML = "<span>🔍</span> 检测状态";
        btn.disabled = false;
      });

    document
      .querySelector("#linuxdo-btn-goto")
      .addEventListener("click", () => {
        window.open("https://linux.do/", "_blank");
      });

    document
      .querySelector("#linuxdo-btn-clear-log")
      .addEventListener("click", () => {
        clearRunLogs();
        refreshPanel();
        showToast("日志已清空", "info");
      });

    // 悬浮按钮显示开关
    const toggleBtn = document.querySelector("#linuxdo-toggle-btn");
    if (toggleBtn) {
      toggleBtn.addEventListener("change", (e) => {
        const isVisible = e.target.checked;
        setFloatingBtnVisible(isVisible);

        const floatingBtn = document.querySelector("#linuxdo-floating-btn");
        if (isVisible) {
          if (!floatingBtn) {
            createFloatingButton();
          }
          showToast("悬浮按钮已显示", "success");
        } else {
          if (floatingBtn) {
            floatingBtn.remove();
          }
          showToast("悬浮按钮已隐藏，可通过油猴菜单打开面板", "info");
        }
        refreshPanel();
      });
    }

    // 点击面板外部关闭
    setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
    }, 100);
  }

  function handleOutsideClick(e) {
    const panel = document.querySelector("#linuxdo-control-panel");
    const btn = document.querySelector("#linuxdo-floating-btn");
    if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
      toggleControlPanel(false);
    }
  }

  // 刷新面板
  function refreshPanel() {
    const panel = document.querySelector("#linuxdo-control-panel");
    if (panel) {
      createControlPanel();
    }
    // 更新悬浮按钮状态点颜色
    const statusInfo = getScriptStatusInfo();
    const statusColor = statusInfo.isCheckedInToday ? "#28a745" : "#ffc107";
    const btn = document.querySelector("#linuxdo-floating-btn");
    if (btn) {
      const dot = btn.querySelector("span:last-child");
      if (dot) {
        dot.style.background = statusColor;
        dot.style.boxShadow = `0 0 6px ${statusColor}`;
      }
    }
  }

  // 切换控制面板显示
  function toggleControlPanel(show = null) {
    const panel = document.querySelector("#linuxdo-control-panel");
    const shouldShow = show !== null ? show : !panel;

    if (shouldShow) {
      createControlPanel();
    } else if (panel) {
      panel.style.animation = "slideOut 0.3s ease-out forwards";
      setTimeout(() => panel.remove(), 300);
      document.removeEventListener("click", handleOutsideClick);
    }
  }

  // 测试连接和登录状态
  async function testConnection() {
    log("开始检测连接和登录状态...", "info");

    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: CONFIG.TARGET_URL,
        timeout: 15000,
        onload: function (response) {
          if (response.status === 200) {
            const html = response.responseText;
            const isLoggedIn =
              html.includes("current-user") ||
              html.includes("header-dropdown-toggle") ||
              html.includes("user-menu") ||
              (html.includes("Linux.do") &&
                !html.includes("login-button") &&
                !html.includes("登录"));

            if (isLoggedIn) {
              updateScriptStatus("running", "logged_in");
              log("检测完成: 连接正常，已登录", "success");
              showToast("✅ 连接正常，已登录 Linux.do", "success");
              resolve({ connected: true, loggedIn: true });
            } else {
              updateScriptStatus("running", "not_logged_in");
              log("检测完成: 连接正常，但未登录", "warning");
              showToast("⚠️ 连接正常，但未检测到登录状态", "warning");
              resolve({ connected: true, loggedIn: false });
            }
          } else {
            updateScriptStatus("error", "unknown");
            log(`检测失败: HTTP ${response.status}`, "error");
            reject(new Error(`HTTP ${response.status}`));
          }
        },
        onerror: function (err) {
          updateScriptStatus("error", "unknown");
          log("检测失败: 网络错误", "error");
          showToast("❌ 网络连接失败", "error");
          reject(err);
        },
        ontimeout: function () {
          updateScriptStatus("error", "unknown");
          log("检测失败: 请求超时", "error");
          showToast("❌ 请求超时", "error");
          reject(new Error("Timeout"));
        },
      });
    });
  }

  function createStatusPanel() {
    // 创建悬浮按钮（所有页面都显示）
    createFloatingButton();
  }

  // ==================== 核心签到逻辑 ====================

  function performCheckin() {
    const today = getTodayString();

    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: CONFIG.TARGET_URL,
        timeout: 15000,
        onload: function (response) {
          if (response.status === 200) {
            const html = response.responseText;

            // 检查是否已登录（多种方式判断）
            const isLoggedIn =
              html.includes("current-user") ||
              html.includes("header-dropdown-toggle") ||
              html.includes("user-menu") ||
              (html.includes("Linux.do") &&
                !html.includes("login-button") &&
                !html.includes("登录"));

            if (isLoggedIn) {
              const time = getTimeString();
              GM_setValue(CONFIG.CHECKIN_KEY, today);
              GM_setValue(CONFIG.CHECKIN_TIME_KEY, time);
              updateScriptStatus("success", "logged_in");
              log(`签到成功！日期: ${today}, 时间: ${time}`, "success");
              resolve({ success: true, time: time });
            } else {
              updateScriptStatus("not_logged_in", "not_logged_in");
              log("访问成功但未检测到登录状态，请手动登录 Linux.do", "warning");
              resolve({ success: false, reason: "not_logged_in" });
            }
          } else {
            updateScriptStatus("error", "unknown");
            log(`请求返回异常状态码: ${response.status}`, "error");
            reject(new Error(`HTTP ${response.status}`));
          }
        },
        onerror: function (err) {
          updateScriptStatus("error", "unknown");
          log("签到请求失败: " + JSON.stringify(err), "error");
          reject(err);
        },
        ontimeout: function () {
          updateScriptStatus("error", "unknown");
          log("签到请求超时", "error");
          reject(new Error("Timeout"));
        },
      });
    });
  }

  // ==================== 主逻辑 ====================

  async function init() {
    const today = getTodayString();
    const lastCheckin = GM_getValue(CONFIG.CHECKIN_KEY, "");
    const isLinuxDo = location.hostname === "linux.do";
    const isConnectSite = location.hostname === "connect.linux.do";

    log(`初始化... 当前站点: ${location.hostname}`);
    log(`今日日期: ${today}, 上次签到: ${lastCheckin || "从未"}`);
    updateScriptStatus("running");

    // 在所有页面显示悬浮按钮
    createStatusPanel();

    // 情况1：当前正在 linux.do 网站上
    if (isLinuxDo) {
      if (lastCheckin !== today) {
        const time = getTimeString();
        GM_setValue(CONFIG.CHECKIN_KEY, today);
        GM_setValue(CONFIG.CHECKIN_TIME_KEY, time);
        updateScriptStatus("success", "logged_in");
        log(`检测到主动访问，签到成功！时间: ${time}`, "success");
        showToast(`🎉 今日 Linux.do 登录积分 (+10) 已激活！`, "success");
        refreshPanel();
      } else {
        updateScriptStatus("success", "logged_in");
        log("今日已签到，无需重复操作", "info");
      }
      return;
    }

    // 情况2：在 connect.linux.do
    if (isConnectSite) {
      if (lastCheckin === today) {
        showToast(`✅ 今日已在主站签到，积分将于0点自动结转`, "info");
      } else {
        showToast(`⏳ 今日尚未签到，正在后台执行...`, "warning");
        // 执行签到
        try {
          const result = await performCheckin();
          if (result.success) {
            showToast(`🎉 后台签到成功！时间: ${result.time}`, "success");
            refreshPanel();
          } else {
            showToast(`⚠️ 请先手动登录 Linux.do 主站`, "warning");
          }
        } catch (e) {
          showToast(`❌ 签到失败，请检查网络`, "error");
        }
      }
      return;
    }

    // 情况3：在其他网站（Google/Baidu/Github等），检查是否需要后台签到
    // 再次检查防止重复请求（双重保险）
    if (!isCheckedInToday()) {
      log("今日尚未签到，开始后台静默执行...", "info");

      try {
        const result = await performCheckin();
        if (result.success) {
          showNotification(
            "Linux.do 签到成功 🎉",
            `今日 +10 积分已到手\n签到时间: ${result.time}`,
          );
          showToast(`🐧 Linux.do 后台签到成功！`, "success");
          refreshPanel();
        } else if (result.reason === "not_logged_in") {
          // 未登录不算签到成功，不记录日期
          showNotification(
            "Linux.do 签到提醒",
            "检测到未登录状态，请手动访问 linux.do 登录一次",
          );
          showToast(`⚠️ Linux.do 未登录，请手动登录`, "warning");
        }
      } catch (e) {
        // 网络错误、超时等情况，不记录签到日期，下次还会重试
        log("后台签到失败（可能需要代理）: " + e.message, "error");
        updateScriptStatus("error", "unknown");
        // 失败时不弹通知打扰用户，但会在日志中记录
      }
    } else {
      updateScriptStatus("success");
      log("今日已签到，跳过后台检查（节省资源）", "info");
    }
  }

  // ==================== 油猴菜单命令 ====================

  // 打开控制面板
  GM_registerMenuCommand("🎛️ 打开控制面板", () => {
    toggleControlPanel(true);
  });

  // 手动触发签到
  GM_registerMenuCommand("🔄 手动签到", async () => {
    showToast("正在执行签到...", "info");
    try {
      const result = await performCheckin();
      if (result.success) {
        showToast(`🎉 签到成功！时间: ${result.time}`, "success");
        showNotification(
          "Linux.do 签到成功",
          `手动签到完成\n时间: ${result.time}`,
        );
        refreshPanel();
      } else {
        showToast("⚠️ 未检测到登录状态，请先登录", "warning");
      }
    } catch (e) {
      showToast("❌ 签到失败: " + e.message, "error");
    }
  });

  // 检测连接状态
  GM_registerMenuCommand("🔍 检测连接状态", async () => {
    showToast("正在检测...", "info");
    try {
      await testConnection();
      refreshPanel();
    } catch (e) {
      showToast("❌ 检测失败: " + e.message, "error");
    }
  });

  // 查看签到状态
  GM_registerMenuCommand("📊 查看签到状态", () => {
    const statusInfo = getScriptStatusInfo();

    const status = statusInfo.isCheckedInToday
      ? `✅ 今日已签到\n签到时间: ${statusInfo.lastCheckinTime}`
      : `⏳ 今日未签到\n上次签到: ${statusInfo.lastCheckinDate} ${statusInfo.lastCheckinTime}`;

    const loginStatus =
      {
        logged_in: "✅ 已登录",
        not_logged_in: "⚠️ 未登录",
        unknown: "❓ 未检测",
      }[statusInfo.loginStatus] || "❓ 未知";

    alert(
      `🐧 Linux.do 签到助手 v2.0\n\n📅 签到状态:\n${status}\n\n🔐 登录状态: ${loginStatus}\n\n⏱️ 上次检查: ${statusInfo.lastCheck}\n\n📆 当前日期: ${getTodayString()}`,
    );
  });

  // 重置签到状态（调试用）
  GM_registerMenuCommand("🗑️ 重置签到状态（调试）", () => {
    if (confirm("确定要重置签到状态吗？这将清除今日签到记录。")) {
      GM_setValue(CONFIG.CHECKIN_KEY, "");
      GM_setValue(CONFIG.CHECKIN_TIME_KEY, "");
      GM_setValue(CONFIG.SCRIPT_STATUS_KEY, {
        status: "unknown",
        lastUpdate: "",
      });
      GM_setValue(CONFIG.LOGIN_STATUS_KEY, "unknown");
      showToast("签到状态已重置", "info");
      log("签到状态已重置", "warning");
      refreshPanel();
    }
  });

  // 清空运行日志
  GM_registerMenuCommand("📝 清空运行日志", () => {
    if (confirm("确定要清空所有运行日志吗？")) {
      clearRunLogs();
      showToast("日志已清空", "info");
      refreshPanel();
    }
  });

  // 显示/隐藏悬浮按钮
  GM_registerMenuCommand(
    isFloatingBtnVisible() ? "👁️ 隐藏悬浮按钮" : "👁️ 显示悬浮按钮",
    () => {
      const newState = !isFloatingBtnVisible();
      setFloatingBtnVisible(newState);

      if (newState) {
        createFloatingButton();
        showToast("悬浮按钮已显示", "success");
      } else {
        const btn = document.querySelector("#linuxdo-floating-btn");
        if (btn) btn.remove();
        showToast("悬浮按钮已隐藏", "info");
      }
    },
  );

  // ==================== 启动 ====================

  // 等待页面加载完成后执行
  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }
})();
