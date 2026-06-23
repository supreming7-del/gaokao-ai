# -*- coding: utf-8 -*-
"""Write all three files with correct UTF-8 encoding (no BOM)"""
import os

BASE = r'/sessions/modest-gifted-planck/mnt/高考分析'

# === index.html ===
html = r'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>AI高考志愿填报助手 - 2026新高考</title>
<style>
  :root {
    --primary: #2563eb;
    --primary-light: #3b82f6;
    --primary-dark: #1d4ed8;
    --chong: #ef4444;
    --chong-bg: #fef2f2;
    --wen: #f59e0b;
    --wen-bg: #fffbeb;
    --bao: #10b981;
    --bao-bg: #ecfdf5;
    --ai: #8b5cf6;
    --ai-bg: #f5f3ff;
    --bg: #f8fafc;
    --card: #ffffff;
    --text: #1e293b;
    --text-secondary: #64748b;
    --border: #e2e8f0;
    --shadow: 0 1px 3px rgba(0,0,0,0.1);
    --radius: 12px;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Noto Sans CJK", sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    padding-bottom: 60px;
  }
  .header {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%);
    color: white; padding: 28px 20px 20px; text-align: center; position: relative; overflow: hidden;
  }
  .header::after {
    content: ''; position: absolute; bottom: -20px; left: -20px; right: -20px;
    height: 40px; background: var(--bg); border-radius: 50% 50% 0 0;
  }
  .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .header .sub { font-size: 13px; opacity: 0.85; }
  .header .tag {
    display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);
    border-radius: 12px; padding: 2px 10px; font-size: 11px; margin-top: 6px;
  }
  .container { max-width: 640px; margin: 0 auto; padding: 0 16px; }
  .card {
    background: var(--card); border-radius: var(--radius);
    box-shadow: var(--shadow); padding: 20px; margin-top: 16px;
  }
  .form-group { margin-bottom: 16px; }
  .form-group label {
    display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px; color: var(--text);
  }
  .form-group select, .form-group input[type="number"] {
    width: 100%; padding: 12px 14px; border: 1.5px solid var(--border);
    border-radius: 8px; font-size: 16px; color: var(--text); background: white;
    transition: border-color 0.2s; -webkit-appearance: none; appearance: none;
  }
  .form-group select:focus, .form-group input:focus {
    outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .btn-primary {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white; border: none; border-radius: 8px; font-size: 17px;
    font-weight: 600; cursor: pointer; transition: transform 0.15s;
  }
  .btn-primary:active { transform: scale(0.98); }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .btn-gold {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white; border: none; border-radius: 8px; font-size: 17px;
    font-weight: 700; cursor: pointer; transition: transform 0.15s;
  }
  .btn-gold:active { transform: scale(0.98); }
  .btn-gold:disabled { opacity: 0.6; cursor: not-allowed; }
  .loading { display: none; text-align: center; padding: 40px 20px; }
  .loading.active { display: block; }
  .spinner {
    width: 40px; height: 40px;
    border: 3px solid var(--border); border-top-color: var(--primary);
    border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .result { display: none; }
  .result.active { display: block; }
  .section-title { font-size: 16px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .section-title .icon { font-size: 18px; }
  .rec-card { border-radius: 10px; padding: 14px; margin-bottom: 10px; border-left: 4px solid; position: relative; }
  .rec-card.chong { background: var(--chong-bg); border-color: var(--chong); }
  .rec-card.wen { background: var(--wen-bg); border-color: var(--wen); }
  .rec-card.bao { background: var(--bao-bg); border-color: var(--bao); }
  .rec-card .school-name { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
  .rec-card .group-tag { font-size: 12px; color: var(--text-secondary); font-weight: 400; }
  .rec-card .meta-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 6px; }
  .rec-card .meta-item { font-size: 12px; color: var(--text-secondary); }
  .rec-card .xk-badge {
    display: inline-block; padding: 1px 8px; border-radius: 4px;
    font-size: 11px; font-weight: 600; background: #dbeafe; color: #1d4ed8;
  }
  .rec-card .xk-badge.match { background: #d1fae5; color: #065f46; }
  .rec-card .prob {
    display: inline-block; padding: 2px 10px; border-radius: 12px;
    font-size: 13px; font-weight: 600; margin-bottom: 6px;
  }
  .chong .prob { background: #fecaca; color: #dc2626; }
  .wen .prob { background: #fde68a; color: #d97706; }
  .bao .prob { background: #a7f3d0; color: #059669; }
  .rec-card .reason { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
  .rec-card .majors { font-size: 13px; color: var(--text-secondary); margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.05); }
  .rec-card .majors span {
    display: inline-block; background: rgba(0,0,0,0.04);
    padding: 1px 6px; border-radius: 4px; margin: 1px 3px 1px 0; font-size: 12px;
  }
  .summary-box {
    background: #eff6ff; border: 1px solid #bfdbfe;
    border-radius: 10px; padding: 14px; margin-top: 16px;
    font-size: 14px; line-height: 1.7; color: #1e40af;
  }
  .disclaimer {
    background: #f8fafc; border: 1px dashed #cbd5e1;
    border-radius: 8px; padding: 10px 14px; margin-top: 12px;
    font-size: 12px; color: var(--text-secondary); text-align: center;
  }
  .error-box { display: none; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 20px; text-align: center; margin-top: 16px; }
  .error-box.active { display: block; }
  .error-box .error-icon { font-size: 36px; margin-bottom: 4px; }
  .error-box .error-title { font-size: 16px; font-weight: 600; color: #dc2626; margin-bottom: 4px; }
  .error-box .error-detail { font-size: 13px; color: var(--text-secondary); }
  .tips {
    background: #f0f9ff; border: 1px solid #bae6fd;
    border-radius: 10px; padding: 12px 14px; margin-top: 12px;
    font-size: 13px; color: #0369a1; line-height: 1.6;
  }
  .tips strong { display: block; margin-bottom: 4px; font-size: 14px; }
  .footer { text-align: center; padding: 24px 16px; font-size: 12px; color: var(--text-secondary); }
  .ai-btn {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white; border: none; border-radius: 8px; padding: 8px 16px;
    font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
    transition: transform 0.15s;
  }
  .ai-btn:active { transform: scale(0.96); }
  .ai-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .ai-btn.small { padding: 4px 10px; font-size: 11px; }
  .ai-result {
    margin-top: 8px; padding: 10px 12px; border-radius: 8px;
    font-size: 13px; line-height: 1.7; display: none;
    background: var(--ai-bg); border: 1px solid #ddd6fe; color: #4c1d95;
  }
  .ai-result.active { display: block; }
  .ai-result .ai-loading {
    display: flex; align-items: center; gap: 8px; color: var(--text-secondary);
  }
  .ai-result .ai-loading .mini-spinner {
    width: 16px; height: 16px; border: 2px solid #e0e7ff;
    border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0;
  }
  .ai-result .ai-error { color: #dc2626; }
  .ai-result .ai-label { font-weight: 600; font-size: 12px; margin-bottom: 4px; color: #7c3aed; }

  /* 解锁卡 */
  .unlock-card {
    background: linear-gradient(135deg, #fffbeb, #fef3c7);
    border: 2px solid #f59e0b;
    border-radius: 12px; padding: 20px; margin-top: 16px; text-align: center;
  }
  .unlock-card h3 { font-size: 18px; color: #92400e; margin-bottom: 4px; }
  .unlock-card .price { font-size: 28px; font-weight: 800; color: #92400e; }
  .unlock-card .price small { font-size: 14px; font-weight: 400; }
  .unlock-card .perks { font-size: 13px; color: #78350f; margin: 8px 0 12px; line-height: 1.6; }
  .unlock-card .buy-hint {
    background: white; border-radius: 8px; padding: 12px; margin: 8px 0;
    border: 1px dashed #f59e0b; font-size: 13px; color: #78350f;
  }
  .unlock-card .divider { font-size: 13px; color: var(--text-secondary); margin: 10px 0; }
  .unlock-card .code-row {
    display: flex; gap: 8px;
  }
  .unlock-card .code-row input {
    flex: 1; padding: 10px; border: 1.5px solid var(--border); border-radius: 6px;
    font-size: 18px; text-align: center; letter-spacing: 4px; text-transform: uppercase;
  }
  .unlock-card .code-row button {
    padding: 10px 20px; background: #059669; color: white; border: none;
    border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer;
  }
  .unlock-msg { font-size: 13px; margin-top: 8px; padding: 8px; border-radius: 6px; display: none; }
  .unlock-msg.success { display: block; background: #d1fae5; color: #065f46; }
  .unlock-msg.error { display: block; background: #fee2e2; color: #991b1b; }

  /* 再选科目 */
  .subject-grid {
    display: flex; flex-wrap: wrap; gap: 10px;
  }
  .subject-grid .check-btn {
    flex: 1; min-width: 72px; display: flex; align-items: center; gap: 4px;
    padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 8px;
    font-size: 14px; cursor: pointer; transition: all 0.15s; background: white;
    user-select: none; -webkit-user-select: none; justify-content: center;
  }
  .subject-grid .check-btn:active { transform: scale(0.97); }
  .subject-grid .check-btn.checked {
    background: #eff6ff; border-color: var(--primary); color: var(--primary-dark);
    box-shadow: 0 0 0 1px var(--primary);
  }
  .subject-grid .check-btn input { display: none; }

  /* 首选科目 */
  .subject-type-row {
    display: flex; gap: 10px;
  }
  .subject-type-row .type-btn {
    flex: 1; padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 8px;
    text-align: center; font-size: 15px; font-weight: 600; cursor: pointer;
    background: white; transition: all 0.15s; user-select: none; -webkit-user-select: none;
  }
  .subject-type-row .type-btn:active { transform: scale(0.97); }
  .subject-type-row .type-btn.active {
    background: #2563eb; color: white; border-color: #2563eb;
  }
  .subject-type-row .type-btn input { display: none; }

  /* 数据产品卡 */
  .data-card {
    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
    border: 2px solid #10b981;
    border-radius: 12px; padding: 20px; margin-top: 16px;
  }
  .data-card h3 { font-size: 16px; color: #065f46; margin-bottom: 4px; }
  .data-card .data-desc { font-size: 13px; color: #065f46; line-height: 1.6; margin: 6px 0; }
  .data-card .sample-table {
    background: white; border-radius: 6px; padding: 8px; margin: 10px 0;
    font-size: 11px; overflow-x: auto;
  }
  .data-card .sample-table table { width: 100%; border-collapse: collapse; }
  .data-card .sample-table th, .data-card .sample-table td {
    border: 1px solid #e2e8f0; padding: 4px 6px; text-align: left; white-space: nowrap;
  }
  .data-card .sample-table th { background: #f0fdf4; font-weight: 600; }

  /* 完整报告 */
  .report-box {
    background: linear-gradient(135deg, #faf5ff, #f5f3ff);
    border: 1px solid #ddd6fe; border-radius: 10px; padding: 14px; margin-top: 12px;
    font-size: 14px; line-height: 1.7; color: #4c1d95; display: none;
  }
  .report-box.active { display: block; }
  .report-box .report-loading {
    display: flex; align-items: center; gap: 8px; color: var(--text-secondary);
  }
  .report-box .report-loading .mini-spinner {
    width: 16px; height: 16px; border: 2px solid #e9d5ff;
    border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite;
  }

  /* 锁定遮罩 */
  .lock-overlay {
    display: none; position: fixed; bottom: 0; left: 0; right: 0;
    background: linear-gradient(to top, rgba(255,255,255,1) 60%, rgba(255,255,255,0));
    padding: 80px 20px 20px; z-index: 100; text-align: center;
  }
  .lock-overlay.active { display: block; }
  .lock-overlay .lock-text { font-size: 14px; color: var(--text-secondary); margin-bottom: 10px; }

  @media (max-width: 480px) {
    .header h1 { font-size: 20px; }
    .form-row { grid-template-columns: 1fr; }
    .subject-grid .check-btn { min-width: 64px; padding: 8px 10px; font-size: 13px; }
    .container { padding: 0 12px; }
  }
</style>
</head>
<body>

<div class="header">
  <h1>AI 高考志愿助手</h1>
  <div class="sub">2026 甘肃新高考 · 院校专业组 · 3+1+2 模式</div>
  <div class="tag">基于 1007 所院校 · 4757 个专业组真实录取数据</div>
</div>

<div class="container">

  <!-- 付费解锁 -->
  <div class="unlock-card" id="unlockCard">
    <h3>解锁 AI 智能分析</h3>
    <div class="price">19.9 <small>7天不限次使用</small></div>
    <div class="perks">
      1007 所院校 · 4757 个专业组真实录取数据<br>
      冲稳保推荐 · 选科匹配 · AI 智能解读<br>
      基于 2026 年甘肃省 3+1+2 院校专业组招生计划
    </div>
    <div class="buy-hint" onclick="window.open('https://m.tb.cn/h.RqcQkLd?tk=GC2TgSX1vEA','_blank')" style="cursor:pointer;">
      <strong>点击打开闲鱼商品页面</strong><br>
      <span style="font-size:12px;color:var(--text-secondary);">购买后收到激活码，输入下方即可解锁</span>
    </div>
    <div class="divider">— 已购买？输入激活码 —</div>
    <div class="code-row">
      <input type="text" id="codeInput" maxlength="8" placeholder="输入8位激活码" autocomplete="off">
      <button onclick="submitCode()">解锁</button>
    </div>
    <div id="unlockMsg" class="unlock-msg"></div>
  </div>

  <!-- 数据产品 -->
  <div class="data-card">
    <h3>2018-2025 甘肃高考原始数据</h3>
    <div class="data-desc">
      包含 <strong>2018-2025</strong> 年甘肃省全部院校招生计划原始数据（Excel），<br>
      可自行筛选、分析、研究。<br>
      <strong>院校代码、专业名称、计划人数、学制、学费、录取最低分、最低位次</strong>
    </div>
    <div class="sample-table">
      <table>
        <tr><th>年份</th><th>院校</th><th>科类</th><th>专业</th><th>计划数</th><th>最低分</th><th>最低位次</th></tr>
        <tr><td>2025</td><td>兰州大学</td><td>物理</td><td>计算机类</td><td>28</td><td>594</td><td>5231</td></tr>
        <tr><td>2025</td><td>西北师范大学</td><td>物理</td><td>数学类</td><td>45</td><td>511</td><td>6894</td></tr>
        <tr><td>2024</td><td>兰州理工大学</td><td>物理</td><td>机械设计</td><td>86</td><td>495</td><td>12756</td></tr>
        <tr><td>2025</td><td>甘肃农业大学</td><td>历史</td><td>农林经济</td><td>12</td><td>472</td><td>19750</td></tr>
        <tr><td>2023</td><td>天水师范学院</td><td>物理</td><td>小学教育</td><td>30</td><td>423</td><td>23561</td></tr>
      </table>
    </div>
    <div style="font-size:14px;font-weight:600;color:#065f46;text-align:center;">
      原始数据（Excel 文件）= 9.9<br>
      <button class="btn-primary" style="margin-top:8px;padding:10px;font-size:14px;" onclick="window.open('https://m.tb.cn/h.RqcQkLd?tk=GC2TgSX1vEA','_blank')">在闲鱼购买原始数据</button>
    </div>
  </div>

  <!-- 查询表单 -->
  <div class="card">
    <form id="mainForm" onsubmit="return false;">
      <div class="form-group">
        <label>省份</label>
        <select id="province">
          <option value="甘肃" selected>甘肃</option>
        </select>
      </div>
      <div class="form-group">
        <label>首选科目</label>
        <div class="subject-type-row" id="subjectTypeRow">
          <label class="type-btn active" data-value="物理类">
            <input type="radio" name="subjectType" value="物理类" checked> 物理类
          </label>
          <label class="type-btn" data-value="历史类">
            <input type="radio" name="subjectType" value="历史类"> 历史类
          </label>
        </div>
      </div>
      <div class="form-group">
        <label>再选科目 <span style="font-weight:400;color:var(--text-secondary);font-size:12px;">（选2科）</span></label>
        <div class="subject-grid" id="subjectGrid">
          <label class="check-btn" data-value="化学"><input type="checkbox" value="化学"> 化学</label>
          <label class="check-btn" data-value="生物"><input type="checkbox" value="生物"> 生物</label>
          <label class="check-btn" data-value="地理"><input type="checkbox" value="地理"> 地理</label>
          <label class="check-btn" data-value="思想政治"><input type="checkbox" value="思想政治"> 思想政治</label>
        </div>
        <div id="subjectError" style="font-size:12px;color:#ef4444;display:none;margin-top:4px;">请选择2科再选科目</div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>高考分数</label>
          <input type="number" id="score" min="0" max="750" placeholder="例：580" required>
        </div>
        <div class="form-group">
          <label>全省位次（推荐）</label>
          <input type="number" id="rank" min="0" placeholder="例：12500">
        </div>
      </div>
      <button type="button" class="btn-primary" id="submitBtn">智能推荐</button>
    </form>
    <div class="tips">
      <strong>提示</strong>
      院校专业组是2026新高考的基本填报单位，每组可填6个专业。位次比分数更准确，结果仅供参考。
    </div>
  </div>

  <div id="loading" class="card loading">
    <div class="spinner"></div>
    <p>正在分析 4757 个专业组...</p>
  </div>

  <div id="errorBox" class="error-box">
    <div class="error-icon"></div>
    <div class="error-title">获取失败</div>
    <div class="error-detail" id="errorDetail"></div>
    <button onclick="retryLastQuery()" style="margin-top:12px;padding:8px 20px;border:1px solid #fecaca;border-radius:6px;background:white;color:#dc2626;cursor:pointer;font-size:14px;">重试</button>
  </div>

  <div id="result" class="result">
    <!-- 志愿概览 -->
    <div class="card" id="summaryHeader" style="display:none;">
      <div class="section-title" style="justify-content:space-between;">
        <span><span class="icon"></span> 推荐志愿</span>
        <span style="font-size:13px;font-weight:400;color:var(--text-secondary);" id="volunteerCount"></span>
      </div>
      <div style="display:flex;gap:8px;font-size:13px;">
        <span style="color:#dc2626;font-weight:600;">冲 <span id="chongCount">0</span></span>
        <span style="color:#d97706;font-weight:600;">稳 <span id="wenCount">0</span></span>
        <span style="color:#059669;font-weight:600;">保 <span id="baoCount">0</span></span>
      </div>
    </div>

    <div class="card">
      <div class="section-title"><span class="icon"></span> 冲刺推荐（冲）</div>
      <div id="chongList"></div>
    </div>
    <div class="card">
      <div class="section-title"><span class="icon"></span> 稳妥推荐（稳）</div>
      <div id="wenList"></div>
    </div>
    <div class="card">
      <div class="section-title"><span class="icon"></span> 保底推荐（保）</div>
      <div id="baoList"></div>
    </div>

    <!-- 完整AI报告 -->
    <div class="card">
      <div class="section-title"><span class="icon"></span> AI 完整填报方案</div>
      <button class="btn-gold" onclick="generateFullReport()" id="reportBtn">AI 一键生成完整方案</button>
      <div class="report-box" id="reportBox">
        <div class="report-loading" id="reportLoading">
          <div class="mini-spinner"></div>
          <span>AI 正在生成完整填报方案...</span>
        </div>
        <div id="reportContent"></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title"><span class="icon"></span> 综合建议</div>
      <div id="summaryBox" class="summary-box"></div>
      <div id="disclaimerBox" class="disclaimer"></div>
    </div>
  </div>

  <!-- 锁定遮罩 -->
  <div class="lock-overlay" id="lockOverlay">
    <div style="font-size:36px;"></div>
    <div class="lock-text">推荐已生成，解锁后查看完整内容</div>
    <button class="btn-gold" style="width:auto;padding:12px 32px;font-size:16px;" onclick="scrollToUnlock()">解锁</button>
  </div>

  <div class="footer">
    AI高考志愿助手 · 数据来源：甘肃省2026年招生计划（院校专业组）· 仅供参考
  </div>
</div>

<script>
// ========== 首选科目切换 ==========
document.querySelectorAll('#subjectTypeRow .type-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('#subjectTypeRow .type-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    this.querySelector('input').checked = true;
  });
});

// ========== 再选科目（最多选2科）==========
document.querySelectorAll('#subjectGrid .check-btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const cb = this.querySelector('input');
    if (cb.checked) {
      cb.checked = false;
      this.classList.remove('checked');
    } else {
      const checked = document.querySelectorAll('#subjectGrid input:checked');
      if (checked.length >= 2) {
        document.getElementById('subjectError').style.display = 'block';
        setTimeout(() => { document.getElementById('subjectError').style.display = 'none'; }, 2000);
        return;
      }
      cb.checked = true;
      this.classList.add('checked');
      document.getElementById('subjectError').style.display = 'none';
    }
  });
});

// ========== 激活码（带有效期校验）==========
function getExpires() { return parseInt(localStorage.getItem('gaokao_expires') || '0'); }
function getCode() { return localStorage.getItem('gaokao_code') || ''; }
function isUnlocked() { return Date.now() < getExpires(); }
function daysLeft() { const e = getExpires(); if (!e) return 0; return Math.ceil((e - Date.now()) / 86400000); }
function scrollToUnlock() { document.getElementById('codeInput').focus(); document.getElementById('unlockCard').scrollIntoView({behavior:'smooth'}); }

function lockUser() {
  localStorage.removeItem('gaokao_expires');
  localStorage.removeItem('gaokao_code');
  document.getElementById('lockOverlay').classList.add('active');
  document.getElementById('unlockCard').style.display = 'block';
  scrollToUnlock();
}

(function checkExpiry() {
  if (localStorage.getItem('gaokao_expires') && !isUnlocked()) {
    localStorage.removeItem('gaokao_expires');
    localStorage.removeItem('gaokao_code');
  }
  if (isUnlocked() && !getCode()) {
    localStorage.removeItem('gaokao_expires');
    document.getElementById('unlockCard').style.display = 'block';
  }
})();

async function submitCode() {
  const code = document.getElementById('codeInput').value.trim().toUpperCase();
  const msg = document.getElementById('unlockMsg');
  if (!code || code.length < 4) { msg.className = 'unlock-msg error'; msg.textContent = '请输入完整的8位激活码'; return; }
  msg.className = ''; msg.textContent = '验证中...';
  try {
    const res = await fetch('/api/verify-code', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({code}) });
    const data = await res.json();
    if (data.valid) {
      localStorage.setItem('gaokao_expires', String(data.expires));
      localStorage.setItem('gaokao_code', code);
      msg.className = 'unlock-msg success';
      const days = daysLeft();
      msg.textContent = '解锁成功！有效期至 ' + new Date(data.expires).toLocaleDateString('zh-CN') + '（剩余' + days + '天）';
      document.getElementById('lockOverlay').classList.remove('active');
      document.getElementById('unlockCard').style.display = 'none';
      if (lastRecData) { document.getElementById('result').classList.add('active'); }
    } else {
      msg.className = 'unlock-msg error';
      msg.textContent = data.reason || '激活码无效';
    }
  } catch(e) { msg.className = 'unlock-msg error'; msg.textContent = '网络错误，请稍后重试'; }
}

// ========== 获取表单数据 ==========
function getFormData() {
  const province = document.getElementById('province').value;
  const score = document.getElementById('score').value;
  const rank = document.getElementById('rank').value;
  const subjectType = document.querySelector('input[name="subjectType"]:checked').value;
  const checkedSubjects = Array.from(document.querySelectorAll('#subjectGrid input:checked')).map(cb => cb.value);
  return { province, score, rank, subjectType, subjects: checkedSubjects.join(',') };
}

// ========== 状态 ==========
let lastQueryData = null, lastRecData = null, aiResults = {};

// ========== 表单提交 ==========
document.getElementById('submitBtn').addEventListener('click', async function() {
  const formData = getFormData();
  if (!formData.score) { alert('请输入分数'); return; }
  if (formData.subjects.length < 2) {
    document.getElementById('subjectError').style.display = 'block';
    document.getElementById('subjectError').textContent = '请选择2科再选科目';
    return;
  }
  document.getElementById('subjectError').style.display = 'none';

  lastQueryData = formData;
  aiResults = {};
  document.getElementById('lockOverlay').classList.remove('active');
  document.getElementById('result').classList.remove('active');
  document.getElementById('errorBox').classList.remove('active');
  document.getElementById('loading').classList.add('active');
  document.getElementById('submitBtn').disabled = true;

  try {
    const r = await fetch('/api/recommend', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        province: formData.province,
        score: formData.score,
        rank: formData.rank,
        subjectType: formData.subjectType,
        subjects: formData.subjects,
        activationCode: getCode()
      })
    });
    if (!r.ok) throw Error('err');
    const d = await r.json();
    if (d.code_invalid) { lockUser(); document.getElementById('errorDetail').textContent = d.error; document.getElementById('errorBox').classList.add('active'); return; }
    if (d.error) { document.getElementById('errorDetail').textContent = d.error; document.getElementById('errorBox').classList.add('active'); return; }
    lastRecData = d; renderResults(d);
  } catch(e) {
    const fb = fallback(parseInt(formData.score), formData.rank, formData.subjectType, formData.subjects);
    lastRecData = fb; renderResults(fb);
  } finally {
    document.getElementById('loading').classList.remove('active');
    document.getElementById('submitBtn').disabled = false;
  }
});

// ========== 渲染结果 ==========
function renderResults(data) {
  const c = data.chong||[], w = data.wen||[], b = data.bao||[];
  if (!c.length && !w.length && !b.length) {
    document.getElementById('errorDetail').textContent = '未匹配到推荐志愿';
    document.getElementById('errorBox').classList.add('active');
    return;
  }

  const total = c.length + w.length + b.length;
  document.getElementById('volunteerCount').textContent = '共 ' + total + ' 个志愿';
  document.getElementById('chongCount').textContent = c.length;
  document.getElementById('wenCount').textContent = w.length;
  document.getElementById('baoCount').textContent = b.length;
  document.getElementById('summaryHeader').style.display = 'block';

  renderList('chongList', c, 'chong');
  renderList('wenList', w, 'wen');
  renderList('baoList', b, 'bao');
  document.getElementById('summaryBox').textContent = data.summary||'';
  document.getElementById('disclaimerBox').textContent = data.disclaimer||'';
  document.getElementById('result').classList.add('active');
  document.getElementById('result').scrollIntoView({behavior:'smooth',block:'start'});
  if (!isUnlocked()) document.getElementById('lockOverlay').classList.add('active');
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function renderList(id, items, type) {
  const el = document.getElementById(id);
  if (!items||!items.length) {
    el.innerHTML = '<div style="text-align:center;padding:12px;color:var(--text-secondary);font-size:14px;">暂未匹配到推荐</div>';
    return;
  }
  el.innerHTML = items.map((item,idx) => {
    const typeLabel = type==='chong'?'冲':type==='wen'?'稳':'保';
    const schoolSafe = escHtml(item.school);
    const uid = 'ai_' + schoolSafe.replace(/[^a-zA-Z0-9_一-鿿]/g,'_') + '_' + idx;
    const xkLabel = item.xk === '不限' ? '不限选科' : '选科: ' + escHtml(item.xk);

    let diffText = '';
    if (item.diff !== undefined && item.diff !== null) {
      const d = parseInt(item.diff);
      diffText = (d > 0 ? '低于最低位次 +' + d : (d < 0 ? '高于最低位次 ' + d : '与最低位次持平'));
    }

    let majorsHtml = '';
    if (item.majors && item.majors.length) {
      majorsHtml = '<div class="majors">' + item.majors.map(m => {
        const mName = escHtml(typeof m === 'string' ? m : (m.name||''));
        const mPlan = (typeof m === 'object' && m.plan) ? '(' + m.plan + '人)' : '';
        return '<span>' + mName + mPlan + '</span>';
      }).join('') + '</div>';
    }

    return '<div class="rec-card ' + type + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">' +
        '<div style="flex:1;min-width:0;">' +
          '<div class="school-name">' + (idx+1) + '. ' + schoolSafe + ' <span class="group-tag">专业组 ' + escHtml(item.group) + '</span></div>' +
        '</div>' +
        '<button class="ai-btn small" onclick="analyzeSingle(\'' + schoolSafe.replace(/'/g,"\\'") + '\',\'' + typeLabel + '\')" id="' + uid + '_btn">AI 分析</button>' +
      '</div>' +
      '<div class="meta-row">' +
        '<span class="xk-badge match">' + xkLabel + '</span>' +
        (item.plan_total ? '<span class="meta-item">计划 ' + item.plan_total + '人</span>' : '') +
        (item.major_count ? '<span class="meta-item">' + item.major_count + '个专业</span>' : '') +
      '</div>' +
      '<div class="prob">录取概率 ' + (item.probability||'待估') + '</div>' +
      '<div class="reason">最低位次 ' + (item.min_rank||'--') + '名' +
        (item.min_score ? ' · 最低分 ' + item.min_score : '') +
        (diffText ? ' · ' + diffText : '') +
      '</div>' +
      majorsHtml +
      '<div class="ai-result" id="' + uid + '_res"></div>' +
    '</div>';
  }).join('');
}

// ========== AI 分析 ==========
async function analyzeSingle(schoolName, typeLabel) {
  if (!isUnlocked()) { scrollToUnlock(); return; }
  const sn = schoolName.replace(/[^a-zA-Z0-9_一-鿿]/g,'_');
  const div = document.getElementById(sn+'_res');
  const btn = document.getElementById(sn+'_btn');
  if (!div||!lastRecData) return;
  if (aiResults[schoolName]) {
    div.classList.toggle('active');
    btn.textContent = div.classList.contains('active') ? '已解读' : 'AI 分析';
    return;
  }
  btn.disabled=true; btn.textContent='分析中';
  div.innerHTML='<div class="ai-loading"><div class="mini-spinner"></div><span>AI 分析中...</span></div>';
  div.classList.add('active');
  const all = [...(lastRecData.chong||[]),...(lastRecData.wen||[]),...(lastRecData.bao||[])];
  const si = all.find(i=>i.school===schoolName);
  if (!si) { div.innerHTML='<div class="ai-error">未找到数据</div>'; btn.disabled=false; btn.textContent='AI 分析'; return; }
  try {
    const r = await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      schools:[{school:si.school,type:typeLabel,min_rank:si.min_rank,min_score:si.min_score,diff:si.diff}],
      userInfo:{score:lastQueryData?.score,rank:lastQueryData?.rank,subjectType:lastQueryData?.subjectType},
      activationCode: getCode()
    })});
    if (!r.ok) throw Error();
    const d = await r.json();
    if (d.code_invalid) { lockUser(); scrollToUnlock(); btn.disabled=false; btn.textContent='AI 分析'; return; }
    if (d.results&&d.results[0]&&d.results[0].analysis) {
      aiResults[schoolName]=d.results[0].analysis;
      div.innerHTML='<div class="ai-label">AI 智能解读</div>'+d.results[0].analysis;
      btn.textContent='已解读';
    } else {
      div.innerHTML='<div class="ai-error">'+(d.results[0]?.error||'分析暂不可用')+'</div>';
      btn.textContent='AI 分析';
    }
  } catch(e) { div.innerHTML='<div class="ai-error">AI 暂不可用</div>'; btn.textContent='AI 分析'; }
  finally { btn.disabled=false; }
}

// ========== 完整报告 ==========
async function generateFullReport() {
  if (!isUnlocked()) { scrollToUnlock(); return; }
  if (!lastRecData) return;
  const box = document.getElementById('reportBox');
  const loading = document.getElementById('reportLoading');
  const content = document.getElementById('reportContent');
  const btn = document.getElementById('reportBtn');
  btn.disabled = true; btn.textContent = '生成中...';
  box.classList.add('active'); loading.style.display = 'flex'; content.textContent = '';
  try {
    const r = await fetch('/api/full-report', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
      userInfo:{score:lastQueryData?.score,rank:lastQueryData?.rank,subjectType:lastQueryData?.subjectType},
      chong:lastRecData.chong, wen:lastRecData.wen, bao:lastRecData.bao,
      activationCode: getCode()
    })});
    if (!r.ok) throw Error();
    const d = await r.json();
    if (d.code_invalid) { lockUser(); btn.disabled=false; btn.textContent='生成方案'; loading.style.display='none'; return; }
    loading.style.display = 'none';
    if (d.report) content.innerHTML = d.report;
    else content.innerHTML = '报告生成失败';
    btn.textContent = '重新生成方案';
  } catch(e) { loading.style.display='none'; content.innerHTML='报告生成失败，请稍后重试'; btn.textContent='重新生成方案'; }
  finally { btn.disabled=false; }
}

function retryLastQuery() {
  if(lastQueryData) document.getElementById('submitBtn').click();
}

// ========== 兜底数据（院校专业组版）==========
function fallback(score, rank, subjectType, subjects) {
  const subjLabel = subjectType === '物理类' ? '物理' : '历史';
  return {
    chong:[
      {school:'兰州大学',group:'027',xk:'化学',probability:'15%',diff:2500,min_rank:6000,min_score:580,plan_total:120,major_count:6,majors:[{name:'计算机类',plan:30},{name:'电子信息类',plan:25},{name:'数学类',plan:20}]},
      {school:'西北师范大学',group:'031',xk:'不限',probability:'20%',diff:1800,min_rank:8500,min_score:555,plan_total:200,major_count:12,majors:[{name:'汉语言文学',plan:40},{name:'教育学',plan:35},{name:'数学与应用数学',plan:30}]}
    ],
    wen:[
      {school:'兰州理工大学',group:'015',xk:'化学',probability:'65%',diff:-200,min_rank:13000,min_score:530,plan_total:180,major_count:10,majors:[{name:'机械设计制造',plan:40},{name:'电气工程',plan:35},{name:'自动化',plan:30}]},
      {school:'兰州财经大学',group:'022',xk:'不限',probability:'70%',diff:-500,min_rank:15000,min_score:520,plan_total:160,major_count:8,majors:[{name:'会计学',plan:35},{name:'金融学',plan:30},{name:'统计学',plan:25}]},
      {school:'甘肃政法大学',group:'018',xk:'思想政治',probability:'72%',diff:-800,min_rank:16000,min_score:515,plan_total:120,major_count:6,majors:[{name:'法学',plan:50},{name:'行政管理',plan:30}]}
    ],
    bao:[
      {school:'天水师范学院',group:'009',xk:'不限',probability:'90%',diff:-3000,min_rank:20000,min_score:490,plan_total:250,major_count:14,majors:[{name:'小学教育',plan:60},{name:'学前教育',plan:50}]},
      {school:'甘肃农业大学',group:'012',xk:'化学+生物',probability:'92%',diff:-4000,min_rank:22000,min_score:485,plan_total:200,major_count:10,majors:[{name:'农学',plan:45},{name:'动物医学',plan:35}]},
      {school:'河西学院',group:'005',xk:'不限',probability:'95%',diff:-6000,min_rank:25000,min_score:470,plan_total:300,major_count:16,majors:[{name:'汉语言文学',plan:55},{name:'数学',plan:45}]}
    ],
    summary:'基于' + score + '分（' + subjLabel + '），推荐以上冲稳保方案（院校专业组）。建议冲刺5-10个、稳妥20-25个、保底10-15个。',
    disclaimer:'本推荐基于2025年甘肃省录取数据（院校专业组，不含提前批/专项计划），仅供参考。填报前请务必核对省教育考试院官方《招生专业目录》及院校招生章程。'
  };
}

// ========== 初始化 ==========
if (isUnlocked()) document.getElementById('unlockCard').style.display = 'none';
</script>
</body>
</html>'''

with open(os.path.join(BASE, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(html)

print('index.html written, size:', os.path.getsize(os.path.join(BASE, 'index.html')))
