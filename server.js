// AI高考志愿填报助手 - 服务端
// 基于2025年甘肃真实录取数据 + DeepSeek AI 分析
const express = require('express');
const path = require('path');
const fs = require('fs');

// ========== 加载录取数据 ==========
const GAOKAO_DATA = require('./gaokao-data.js');

// ========== 推荐引擎 ==========
function generateRecommendation(province, score, rank, subjectType, subjects) {
  const subjKey = subjectType === '物理类' ? '物理' : '历史';
  const rankNum = rank ? parseInt(rank) : null;

  let candidates = [];
  for (const [school, subjectsData] of Object.entries(GAOKAO_DATA)) {
    if (subjectsData[subjKey]) {
      const info = subjectsData[subjKey];
      if (info.r !== null && info.r !== undefined && info.r !== '') {
        candidates.push({
          school: school,
          min_rank: parseInt(info.r),
          min_score: info.s !== null && info.s !== '' ? parseInt(info.s) : null
        });
      }
    }
  }

  candidates.sort((a, b) => a.min_rank - b.min_rank);

  let chong = [], wen = [], bao = [];

  if (rankNum) {
    for (const c of candidates) {
      const diff = rankNum - c.min_rank;
      if (diff > 300 && diff <= 3500) {
        const prob = Math.round(15 + (1 - (diff - 300) / 3200) * 25);
        chong.push({ school: c.school, min_rank: c.min_rank, min_score: c.min_score, majors: pickMajors(c.school, subjectType), probability: prob + '%', type: '冲', diff });
      } else if (diff >= -500 && diff <= 300) {
        const prob = Math.round(55 + (1 - Math.abs(diff) / 800) * 20);
        wen.push({ school: c.school, min_rank: c.min_rank, min_score: c.min_score, majors: pickMajors(c.school, subjectType), probability: prob + '%', type: '稳', diff });
      } else if (diff < -500) {
        const prob = Math.round(85 + Math.min(Math.abs(diff) / 5000, 0.13) * 100);
        bao.push({ school: c.school, min_rank: c.min_rank, min_score: c.min_score, majors: pickMajors(c.school, subjectType), probability: Math.min(prob, 99) + '%', type: '保', diff });
      }
    }
  } else {
    for (const c of candidates) {
      if (!c.min_score) continue;
      const diff = c.min_score - score;
      if (diff > 0 && diff <= 20) {
        chong.push({ school: c.school, min_rank: c.min_rank, min_score: c.min_score, majors: pickMajors(c.school, subjectType), probability: '30%', type: '冲', diff });
      } else if (diff >= -10 && diff <= 0) {
        wen.push({ school: c.school, min_rank: c.min_rank, min_score: c.min_score, majors: pickMajors(c.school, subjectType), probability: '65%', type: '稳', diff });
      } else if (diff < -10) {
        bao.push({ school: c.school, min_rank: c.min_rank, min_score: c.min_score, majors: pickMajors(c.school, subjectType), probability: '90%', type: '保', diff });
      }
    }
  }

  chong = uniqueSchools(chong).slice(0, 5);
  wen = uniqueSchools(wen).slice(0, 5);
  bao = uniqueSchools(bao).slice(0, 5);

  while (chong.length < 3 && wen.length > 0) chong.push(wen.pop());
  while (bao.length < 3 && wen.length > 0) bao.push(wen.pop());

  return {
    chong, wen, bao,
    summary: generateSummary(province, score, rankNum, subjKey, chong.length, wen.length, bao.length),
    disclaimer: '本推荐基于2025年甘肃省录取数据（不含提前批/专项计划），仅供参考。填报前请务必核对省教育考试院官方数据及院校招生章程。'
  };
}

function uniqueSchools(arr) {
  const seen = new Set();
  return arr.filter(item => {
    if (seen.has(item.school)) return false;
    seen.add(item.school);
    return true;
  });
}

function pickMajors(school, subjectType) {
  const isLiKe = subjectType === '物理类';
  const majorMap = {
    '计算机': ['计算机科学与技术', '软件工程', '人工智能', '数据科学与大数据技术', '物联网工程'],
    '电子':   ['电子信息工程', '通信工程', '微电子科学与工程', '光电信息科学与工程'],
    '机械':   ['机械设计制造及其自动化', '自动化', '机器人工程', '智能制造工程'],
    '土木':   ['土木工程', '建筑学', '城乡规划', '水利水电工程'],
    '经管':   ['会计学', '金融学', '工商管理', '经济学', '财务管理'],
    '文法':   ['法学', '汉语言文学', '新闻学', '英语', '行政管理'],
    '医学':   ['临床医学', '护理学', '药学', '医学影像学', '口腔医学'],
    '教育':   ['教育学', '学前教育', '小学教育', '数学与应用数学'],
    '艺术':   ['视觉传达设计', '环境设计', '数字媒体艺术', '动画'],
    '农林':   ['农学', '园艺', '动物医学', '林学', '食品科学与工程'],
    '语言':   ['翻译', '日语', '法语', '德语', '俄语', '西班牙语'],
    '化工':   ['化学工程与工艺', '应用化学', '制药工程', '材料科学与工程']
  };

  let categories = [];
  const name = school;

  if (name.includes('师范')) {
    categories = isLiKe ? ['教育', '计算机', '经管'] : ['教育', '文法', '经管'];
  } else if (name.includes('医') || name.includes('医药') || name.includes('医学') || name.includes('药科')) {
    categories = isLiKe ? ['医学'] : ['医学'];
  } else if (name.includes('农业') || name.includes('林业') || name.includes('农林') || name.includes('农大')) {
    categories = isLiKe ? ['农林', '经管'] : ['经管', '文法'];
  } else if (name.includes('财经') || name.includes('商贸') || name.includes('经济') || name.includes('金融') || name.includes('工商')) {
    categories = ['经管', '文法'];
  } else if (name.includes('政法') || name.includes('法学') || name.includes('警察') || name.includes('公安') || name.includes('司法')) {
    categories = ['文法'];
  } else if (name.includes('艺术') || name.includes('传媒') || name.includes('音乐') || name.includes('美术') || name.includes('戏剧')) {
    categories = ['艺术', '文法'];
  } else if (name.includes('外国语') || name.includes('语言') || name.includes('外事') || name.includes('外语')) {
    categories = isLiKe ? ['语言', '经管', '计算机'] : ['语言', '文法', '经管'];
  } else if (name.includes('邮电')) {
    categories = isLiKe ? ['计算机', '电子'] : ['经管', '文法'];
  } else if (name.includes('海事') || name.includes('海洋') || name.includes('航运')) {
    categories = isLiKe ? ['机械', '电子', '经管'] : ['经管', '文法'];
  } else if (name.includes('航空') || name.includes('航天') || name.includes('飞行')) {
    categories = isLiKe ? ['机械', '电子', '计算机'] : ['经管', '文法'];
  } else if (name.includes('国防') || name.includes('军工') || name.includes('兵工')) {
    categories = isLiKe ? ['机械', '电子', '计算机'] : ['经管', '文法'];
  } else if (name.includes('体育') || name.includes('运动')) {
    categories = ['教育'];
  } else if (name.includes('石油') || name.includes('地质') || name.includes('矿业') || name.includes('化工') || name.includes('工业') || name.includes('工程')) {
    categories = isLiKe ? ['机械', '化工', '计算机', '电子'] : ['经管', '文法'];
  } else if (name.includes('电力') || name.includes('水利') || name.includes('能源') || name.includes('电气')) {
    categories = isLiKe ? ['电子', '土木', '机械'] : ['经管'];
  } else if (name.includes('理工') || name.includes('科技') || name.includes('交通')) {
    categories = isLiKe ? ['计算机', '电子', '机械', '经管'] : ['经管', '文法', '语言'];
  } else if (name.includes('民族')) {
    categories = isLiKe ? ['文法', '经管', '计算机'] : ['文法', '教育', '经管'];
  } else if (name.includes('职业') || name.includes('技术') || name.includes('专科')) {
    categories = isLiKe ? ['计算机', '电子', '机械', '经管'] : ['经管', '文法', '教育'];
  } else {
    // 综合类大学（无明确行业属性）
    categories = isLiKe
      ? ['计算机', '电子', '经管', '文法', '机械']
      : ['文法', '经管', '教育', '语言'];
  }

  const allMajors = [...new Set(categories.flatMap(c => majorMap[c] || []))];
  // 取前3个（固定而非随机，保证同一学校推荐一致）
  return allMajors.slice(0, 3);
}

function generateSummary(province, score, rankNum, subjKey, chongLen, wenLen, baoLen) {
  const total = chongLen + wenLen + baoLen;
  let summary = `根据2025年甘肃省${subjKey === '物理' ? '物理类' : '历史类'}录取数据，`;
  summary += rankNum ? `你的位次${rankNum}名` : `你的${score}分`;
  if (total > 0) {
    summary += `，共推荐${total}所院校（冲${chongLen}所、稳${wenLen}所、保${baoLen}所）。`;
    summary += '建议按"冲-稳-保"梯度合理搭配：冲刺院校选1-2所、稳妥院校选3-4所、保底院校选2-3所，以最大限度降低滑档风险。';
  } else {
    summary += '，暂未匹配到完全合适的院校。建议联系省教育考试院获取官方志愿指导，或尝试调整目标批次范围。';
  }
  return summary;
}

// ========== DeepSeek AI 分析 ==========
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

async function callDeepSeek(prompt, maxTokens = 300) {
  if (!DEEPSEEK_API_KEY) {
    return { error: 'DeepSeek API 密钥未配置' };
  }

  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位专业的高考志愿填报专家，请用简洁实用的语言为考生提供分析建议。每次回答控制在50字以内。' },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return { error: `DeepSeek API 错误: ${response.status} ${err}` };
    }

    const data = await response.json();
    return { text: data.choices[0].message.content.trim() };
  } catch (error) {
    return { error: `调用 DeepSeek 失败: ${error.message}` };
  }
}

async function analyzeSchool(userInfo, schoolItem) {
  const diff = schoolItem.diff !== undefined ? schoolItem.diff : 0;
  const absDiff = Math.abs(diff);

  let analysisType = '冲一冲（冲刺）';
  if (schoolItem.type === '稳') analysisType = '稳一稳（稳妥）';
  else if (schoolItem.type === '保') analysisType = '保一保（保底）';

  const prompt = `你是一位资深高考志愿填报专家，请为考生提供详细的院校分析（200字以内）。

【考生信息】
- 科目：${userInfo.subjectType}
- ${userInfo.rank ? '全省位次：' + userInfo.rank + '名' : '高考分数：' + userInfo.score + '分'}

【推荐院校】${schoolItem.school}
【2025年录取数据】最低位次 ${schoolItem.min_rank} 名${schoolItem.min_score ? '，最低分 ' + schoolItem.min_score : ''}
【推荐梯度】${analysisType}（位次相差 ${absDiff} 名）

请按以下格式分析（每点用简短的一两句话）：

【学校层次】该校属于什么层次（985/211/双一流/省重点/普通本科/专科），在省内外的认可度如何。

【录取评估】基于你的位次，录取该校的概率有多大，风险点在哪。

【专业建议】该校的王牌专业有哪些，你选科情况下适合报什么专业方向。

【填报策略】这所学校应该填在志愿表的第几个位置，是否建议服从专业调剂。

【同类对比】和同层次的其他学校相比，这所的优势和劣势是什么。`;

  return await callDeepSeek(prompt, 500);
}

// 生成完整AI填报报告
async function generateFullReport(userInfo, chong, wen, bao) {
  const chongList = chong.slice(0, 3).map(s => s.school + '(' + s.probability + ')').join('、');
  const wenList = wen.slice(0, 3).map(s => s.school + '(' + s.probability + ')').join('、');
  const baoList = bao.slice(0, 3).map(s => s.school + '(' + s.probability + ')').join('、');

  const prompt = `你是一位资深高考志愿填报专家，请为考生撰写一份完整的志愿填报方案分析报告（300字以内）。

【考生档案】
- 科目：${userInfo.subjectType}
- ${userInfo.rank ? '全省位次：' + userInfo.rank + '名' : '高考分数：' + userInfo.score + '分'}

【推荐方案】
- 冲刺院校：${chongList || '暂无'}
- 稳妥院校：${wenList || '暂无'}
- 保底院校：${baoList || '暂无'}

请撰写报告，包含以下部分：

1.【梯度搭配评估】当前冲-稳-保的搭配是否合理，建议如何调整数量和比例。

2.【重点推荐】从所有推荐院校中，选出最值得填报的 2-3 所，说明理由。

3.【风险控制】存在哪些滑档风险？如何通过志愿顺序和调剂策略来降低风险。

4.【行动清单】给考生列一个清晰的填报步骤（如先确定哪几所、如何排序等）。`;

  return await callDeepSeek(prompt, 800);
}

// ========== 激活码系统 ==========
const CODES_FILE = path.join(__dirname, 'codes.json');
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin888'; // 建议设置复杂一点的密钥

function loadCodes() {
  try {
    if (fs.existsSync(CODES_FILE)) {
      return JSON.parse(fs.readFileSync(CODES_FILE, 'utf-8'));
    }
  } catch(e) { console.error('加载codes.json失败:', e.message); }
  return {};
}

function saveCodes(codes) {
  fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2));
}

function generateCode(days = 3, memo = '') {
  const codes = loadCodes();
  // 生成8位随机码
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  codes[code] = {
    created: Date.now(),
    expires: Date.now() + days * 24 * 60 * 60 * 1000,
    activated: false,
    firstUsedAt: null,
    lastUsedAt: null,
    memo: memo
  };
  saveCodes(codes);
  return code;
}

// 管理员永久激活码（设置 MASTER_CODE 环境变量）
const MASTER_CODE = process.env.MASTER_CODE || '';

function verifyCode(code) {
  // 管理员永久码：永远有效，不限次数
  if (MASTER_CODE && code === MASTER_CODE) {
    return { valid: true, master: true, expires: Date.now() + 365 * 10 * 24 * 3600 * 1000 };
  }

  const codes = loadCodes();
  const entry = codes[code];
  if (!entry) return { valid: false, reason: '激活码无效' };
  if (Date.now() > entry.expires) return { valid: false, reason: '激活码已过期（' + new Date(entry.expires).toLocaleDateString('zh-CN') + '）' };
  return { valid: true, expires: entry.expires };
}

function trackUsage(code) {
  // 管理员永久码不跟踪
  if (MASTER_CODE && code === MASTER_CODE) return;

  const codes = loadCodes();
  if (codes[code]) {
    codes[code].activated = true;
    if (!codes[code].firstUsedAt) codes[code].firstUsedAt = Date.now();
    codes[code].lastUsedAt = Date.now();
    saveCodes(codes);
  }
}

// 辅助：验证请求中的激活码并跟踪使用
function verifyAndTrack(code) {
  if (!code || !code.trim()) return { valid: false, reason: '请提供激活码' };
  const result = verifyCode(code.trim().toUpperCase());
  if (result.valid) {
    trackUsage(code.trim().toUpperCase());
  }
  return result;
}

// ========== Express 服务 ==========
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 推荐接口
app.post('/api/recommend', (req, res) => {
  try {
    const { province, score, rank, subjectType, subjects, activationCode, chatMode, chatQuestion } = req.body;

    // 验证激活码
    const codeCheck = verifyAndTrack(activationCode);
    if (!codeCheck.valid) {
      return res.json({ code_invalid: true, error: codeCheck.reason || '激活码无效，请重新解锁' });
    }

    if (!province || !score) {
      return res.status(400).json({ error: '请填写省份和分数' });
    }

    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 750) {
      return res.status(400).json({ error: '请输入有效的分数（0-750）' });
    }

    if (chatMode && chatQuestion) {
      return res.json({ answer: 'AI问答模式即将上线，敬请期待。' });
    }

    const result = generateRecommendation(province, scoreNum, rank, subjectType, subjects);
    res.json(result);
  } catch (error) {
    console.error('Recommend error:', error);
    res.status(500).json({ error: '推荐引擎内部错误' });
  }
});

// AI 分析接口
app.post('/api/analyze', async (req, res) => {
  try {
    const { schools, userInfo, activationCode } = req.body;

    // 验证激活码
    const codeCheck = verifyAndTrack(activationCode);
    if (!codeCheck.valid) {
      return res.json({ code_invalid: true, error: codeCheck.reason || '激活码无效，请重新解锁' });
    }

    if (!schools || !Array.isArray(schools) || schools.length === 0) {
      return res.status(400).json({ error: '请提供需要分析的院校列表' });
    }

    // 限制每次最多分析3所（控制成本）
    const toAnalyze = schools.slice(0, 3);

    const results = [];
    for (const school of toAnalyze) {
      const analysis = await analyzeSchool(userInfo, school);
      results.push({
        school: school.school,
        type: school.type,
        analysis: analysis.text || null,
        error: analysis.error || null
      });
    }

    res.json({ results });
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'AI 分析失败，请稍后重试' });
  }
});

// 完整AI填报报告
app.post('/api/full-report', async (req, res) => {
  try {
    const { userInfo, chong, wen, bao, activationCode } = req.body;

    // 验证激活码
    const codeCheck = verifyAndTrack(activationCode);
    if (!codeCheck.valid) {
      return res.json({ code_invalid: true, error: codeCheck.reason || '激活码无效，请重新解锁' });
    }

    if (!userInfo) return res.status(400).json({ error: '缺少考生信息' });

    const result = await generateFullReport(userInfo, chong || [], wen || [], bao || []);
    res.json({ report: result.text || null, error: result.error || null });
  } catch (error) {
    console.error('Full report error:', error);
    res.status(500).json({ error: '生成报告失败' });
  }
});

// DeepSeek 密钥状态检查
app.get('/api/status', (req, res) => {
  res.json({
    ai_ready: !!DEEPSEEK_API_KEY,
    schools_count: Object.keys(GAOKAO_DATA).length
  });
});

// ========== 激活码接口 ==========

// 验证激活码
app.post('/api/verify-code', (req, res) => {
  const { code } = req.body;
  if (!code || !code.trim()) {
    return res.json({ valid: false, reason: '请输入激活码' });
  }
  const result = verifyCode(code.trim().toUpperCase());
  if (result.valid) {
    trackUsage(code.trim().toUpperCase());
  }
  res.json(result);
});

// 管理端：生成激活码（需 ADMIN_KEY）
app.post('/api/admin/generate', (req, res) => {
  const { adminKey, days, count, memo } = req.body;
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: '无权限' });
  }
  const num = Math.min(count || 1, 50);
  const codes = [];
  for (let i = 0; i < num; i++) {
    codes.push(generateCode(days || 3, memo || ''));
  }
  res.json({ codes, days: days || 3, note: '激活码有效期内可多次使用，每次使用均需验证' });
});

// 管理端：查看所有激活码
app.post('/api/admin/list', (req, res) => {
  const { adminKey } = req.body;
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: '无权限' });
  }
  const codes = loadCodes();
  const list = Object.entries(codes).map(([code, info]) => ({
    code,
    created: new Date(info.created).toLocaleString('zh-CN'),
    expires: new Date(info.expires).toLocaleString('zh-CN'),
    activated: info.activated || false,
    firstUsedAt: info.firstUsedAt ? new Date(info.firstUsedAt).toLocaleString('zh-CN') : null,
    lastUsedAt: info.lastUsedAt ? new Date(info.lastUsedAt).toLocaleString('zh-CN') : null,
    memo: info.memo || ''
  }));
  res.json({ total: list.length, codes: list });
});




// ========== 嵌入的管理后台页面 ==========
const ADMIN_HTML_BASE64 = 'PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9InpoLUNOIj4KPGhlYWQ+CjxtZXRhIGNoYXJzZXQ9IlVURi04Ij4KPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjAiPgo8dGl0bGU+566h55CG5ZCO5Y+wIC0g5r+A5rS756CBPC90aXRsZT4KPHN0eWxlPgogICogeyBtYXJnaW46MDsgcGFkZGluZzowOyBib3gtc2l6aW5nOmJvcmRlci1ib3g7IH0KICBib2R5IHsgZm9udC1mYW1pbHk6IC1hcHBsZS1zeXN0ZW0sICJQaW5nRmFuZyBTQyIsIHNhbnMtc2VyaWY7IGJhY2tncm91bmQ6I2Y4ZmFmYzsgY29sb3I6IzFlMjkzYjsgcGFkZGluZzoyMHB4OyB9CiAgLmNvbnRhaW5lciB7IG1heC13aWR0aDo2MDBweDsgbWFyZ2luOjAgYXV0bzsgfQogIC5jYXJkIHsgYmFja2dyb3VuZDp3aGl0ZTsgYm9yZGVyLXJhZGl1czoxMHB4OyBib3gtc2hhZG93OjAgMXB4IDNweCByZ2JhKDAsMCwwLDAuMSk7IHBhZGRpbmc6MjBweDsgbWFyZ2luLWJvdHRvbToxNnB4OyB9CiAgaDEgeyBmb250LXNpemU6MjBweDsgbWFyZ2luLWJvdHRvbToxNnB4OyB9CiAgLmZvcm0tZ3JvdXAgeyBtYXJnaW4tYm90dG9tOjEycHg7IH0KICBsYWJlbCB7IGRpc3BsYXk6YmxvY2s7IGZvbnQtc2l6ZToxNHB4OyBmb250LXdlaWdodDo2MDA7IG1hcmdpbi1ib3R0b206NHB4OyB9CiAgaW5wdXQsIHNlbGVjdCB7IHdpZHRoOjEwMCU7IHBhZGRpbmc6MTBweDsgYm9yZGVyOjEuNXB4IHNvbGlkICNlMmU4ZjA7IGJvcmRlci1yYWRpdXM6NnB4OyBmb250LXNpemU6MTVweDsgfQogIGlucHV0OmZvY3VzIHsgb3V0bGluZTpub25lOyBib3JkZXItY29sb3I6IzNiODJmNjsgfQogIC5mb3JtLXJvdyB7IGRpc3BsYXk6ZmxleDsgZ2FwOjhweDsgfQogIC5mb3JtLXJvdyBpbnB1dCwgLmZvcm0tcm93IHNlbGVjdCB7IGZsZXg6MTsgfQogIGJ1dHRvbiB7IHBhZGRpbmc6MTBweCAyNHB4OyBiYWNrZ3JvdW5kOiMyNTYzZWI7IGNvbG9yOndoaXRlOyBib3JkZXI6bm9uZTsgYm9yZGVyLXJhZGl1czo2cHg7IGZvbnQtc2l6ZToxNXB4OyBmb250LXdlaWdodDo2MDA7IGN1cnNvcjpwb2ludGVyOyB9CiAgYnV0dG9uOmFjdGl2ZSB7IHRyYW5zZm9ybTpzY2FsZSgwLjk3KTsgfQogIGJ1dHRvbi5kYW5nZXIgeyBiYWNrZ3JvdW5kOiNlZjQ0NDQ7IH0KICBidXR0b24uZ3JlZW4geyBiYWNrZ3JvdW5kOiMxMGI5ODE7IH0KICAuY29kZS1saXN0IHsgbWFyZ2luLXRvcDoxMnB4OyB9CiAgLmNvZGUtaXRlbSB7IGRpc3BsYXk6ZmxleDsganVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47IGFsaWduLWl0ZW1zOmNlbnRlcjsgcGFkZGluZzo4cHggMTBweDsgYm9yZGVyLWJvdHRvbToxcHggc29saWQgI2YxZjVmOTsgZm9udC1zaXplOjE0cHg7IH0KICAuY29kZS1pdGVtOmxhc3QtY2hpbGQgeyBib3JkZXItYm90dG9tOm5vbmU7IH0KICAuY29kZS1pdGVtIC5jb2RlIHsgZm9udC13ZWlnaHQ6NzAwOyBmb250LWZhbWlseTptb25vc3BhY2U7IGZvbnQtc2l6ZToxNnB4OyBsZXR0ZXItc3BhY2luZzoycHg7IH0KICAuY29kZS1pdGVtIC5zdGF0dXMgeyBmb250LXNpemU6MTJweDsgcGFkZGluZzoycHggOHB4OyBib3JkZXItcmFkaXVzOjRweDsgfQogIC5zdGF0dXMuYWN0aXZhdGVkIHsgYmFja2dyb3VuZDojZDFmYWU1OyBjb2xvcjojMDY1ZjQ2OyB9CiAgLnN0YXR1cy51bnVzZWQgeyBiYWNrZ3JvdW5kOiNlMmU4ZjA7IGNvbG9yOiM0NzU1Njk7IH0KICAuc3RhdHVzLmV4cGlyZWQgeyBiYWNrZ3JvdW5kOiNmZWYzYzc7IGNvbG9yOiM5MjQwMGU7IH0KICAubmF2IHsgZGlzcGxheTpmbGV4OyBnYXA6OHB4OyBtYXJnaW4tYm90dG9tOjE2cHg7IH0KICAubmF2IGJ1dHRvbiB7IGZsZXg6MTsgcGFkZGluZzo4cHg7IGZvbnQtc2l6ZToxM3B4OyBiYWNrZ3JvdW5kOndoaXRlOyBjb2xvcjp2YXIoLS10ZXh0KTsgYm9yZGVyOjFweCBzb2xpZCAjZTJlOGYwOyB9CiAgLm5hdiBidXR0b24uYWN0aXZlIHsgYmFja2dyb3VuZDojMjU2M2ViOyBjb2xvcjp3aGl0ZTsgYm9yZGVyLWNvbG9yOiMyNTYzZWI7IH0KICAuYmF0Y2gtcmVzdWx0IHsgbWFyZ2luLXRvcDoxMnB4OyBwYWRkaW5nOjEwcHg7IGJhY2tncm91bmQ6I2YwZmRmNDsgYm9yZGVyLXJhZGl1czo2cHg7IGZvbnQtc2l6ZToxNHB4OyB9CiAgLmJhdGNoLXJlc3VsdCAuY29kZXMgeyBmb250LWZhbWlseTptb25vc3BhY2U7IGZvbnQtc2l6ZToxNXB4OyBsZXR0ZXItc3BhY2luZzoxcHg7IGxpbmUtaGVpZ2h0OjEuODsgfQogIC5jb3B5LWJ0biB7IGZvbnQtc2l6ZToxMnB4OyBwYWRkaW5nOjRweCAxMHB4OyBiYWNrZ3JvdW5kOiNmM2Y0ZjY7IGJvcmRlcjoxcHggc29saWQgI2QxZDVkYjsgYm9yZGVyLXJhZGl1czo0cHg7IGN1cnNvcjpwb2ludGVyOyB9CiAgI2xvZ2luQm94IHsgdGV4dC1hbGlnbjpjZW50ZXI7IHBhZGRpbmc6NDBweCAwOyB9CiAgI2xvZ2luQm94IGlucHV0IHsgbWF4LXdpZHRoOjMwMHB4OyBtYXJnaW46OHB4IGF1dG87IGRpc3BsYXk6YmxvY2s7IHRleHQtYWxpZ246Y2VudGVyOyB9CiAgLnN0YXRzIHsgZGlzcGxheTpmbGV4OyBnYXA6MTJweDsgbWFyZ2luLWJvdHRvbToxMnB4OyB9CiAgLnN0YXQtaXRlbSB7IGZsZXg6MTsgdGV4dC1hbGlnbjpjZW50ZXI7IHBhZGRpbmc6MTJweDsgYmFja2dyb3VuZDojZjhmYWZjOyBib3JkZXItcmFkaXVzOjZweDsgfQogIC5zdGF0LWl0ZW0gLm51bSB7IGZvbnQtc2l6ZToyNHB4OyBmb250LXdlaWdodDo3MDA7IGNvbG9yOiMyNTYzZWI7IH0KICAuc3RhdC1pdGVtIC5sYWJlbCB7IGZvbnQtc2l6ZToxMnB4OyBjb2xvcjojNjQ3NDhiOyB9Cjwvc3R5bGU+CjwvaGVhZD4KPGJvZHk+CjxkaXYgY2xhc3M9ImNvbnRhaW5lciIgaWQ9ImFwcCI+CiAgPGgxPvCflJEg5r+A5rS756CB566h55CGPC9oMT4KICA8ZGl2IGNsYXNzPSJjYXJkIiBpZD0ibG9naW5Cb3giPgogICAgPGRpdiBzdHlsZT0iZm9udC1zaXplOjQwcHg7bWFyZ2luLWJvdHRvbTo4cHg7Ij7wn5SQPC9kaXY+CiAgICA8cCBzdHlsZT0iZm9udC1zaXplOjE0cHg7Y29sb3I6IzY0NzQ4YjttYXJnaW4tYm90dG9tOjEycHg7Ij7ovpPlhaXnrqHnkIblkZjlr4bnoIE8L3A+CiAgICA8aW5wdXQgdHlwZT0icGFzc3dvcmQiIGlkPSJhZG1pbktleSIgcGxhY2Vob2xkZXI9IueuoeeQhuWRmOWvhueggSIgb25rZXlkb3duPSJpZihldmVudC5rZXk9PT0nRW50ZXInKSBsb2dpbigpIj4KICAgIDxidXR0b24gb25jbGljaz0ibG9naW4oKSIgc3R5bGU9Im1hcmdpbi10b3A6OHB4OyI+55m75b2VPC9idXR0b24+CiAgPC9kaXY+CiAgPGRpdiBpZD0iYWRtaW5QYW5lbCIgc3R5bGU9ImRpc3BsYXk6bm9uZTsiPgogICAgPGRpdiBjbGFzcz0iY2FyZCI+CiAgICAgIDxkaXYgY2xhc3M9InN0YXRzIiBpZD0ic3RhdHMiPjwvZGl2PgogICAgPC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJjYXJkIj4KICAgICAgPGgyIHN0eWxlPSJmb250LXNpemU6MTZweDttYXJnaW4tYm90dG9tOjEwcHg7Ij7nlJ/miJDmv4DmtLvnoIE8L2gyPgogICAgICA8ZGl2IGNsYXNzPSJmb3JtLXJvdyIgc3R5bGU9Im1hcmdpbi1ib3R0b206OHB4OyI+CiAgICAgICAgPHNlbGVjdCBpZD0iZGF5cyI+PG9wdGlvbiB2YWx1ZT0iMSI+MeWkqTwvb3B0aW9uPjxvcHRpb24gdmFsdWU9IjMiIHNlbGVjdGVkPjPlpKk8L29wdGlvbj48b3B0aW9uIHZhbHVlPSI3Ij435aSpPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT0iMzAiPjMw5aSpPC9vcHRpb24+PC9zZWxlY3Q+CiAgICAgICAgPGlucHV0IHR5cGU9Im51bWJlciIgaWQ9ImNvdW50IiB2YWx1ZT0iNSIgbWluPSIxIiBtYXg9IjUwIiBwbGFjZWhvbGRlcj0i5pWw6YePIj4KICAgICAgICA8YnV0dG9uIGNsYXNzPSJncmVlbiIgb25jbGljaz0iZ2VuZXJhdGVDb2RlcygpIj7nlJ/miJA8L2J1dHRvbj4KICAgICAgPC9kaXY+CiAgICAgIDxpbnB1dCB0eXBlPSJ0ZXh0IiBpZD0ibWVtbyIgcGxhY2Vob2xkZXI9IuWkh+azqO+8iOWPr+mAie+8iSIgc3R5bGU9Im1hcmdpbi10b3A6NHB4OyI+CiAgICAgIDxkaXYgaWQ9ImdlblJlc3VsdCI+PC9kaXY+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImNhcmQiPgogICAgICA8ZGl2IHN0eWxlPSJkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47YWxpZ24taXRlbXM6Y2VudGVyO21hcmdpbi1ib3R0b206OHB4OyI+CiAgICAgICAgPGgyIHN0eWxlPSJmb250LXNpemU6MTZweDsiPua/gOa0u+eggeWIl+ihqDwvaDI+CiAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJsb2FkQ29kZXMoKSIgc3R5bGU9InBhZGRpbmc6NnB4IDEycHg7Zm9udC1zaXplOjEzcHg7Ij7liLfmlrA8L2J1dHRvbj4KICAgICAgPC9kaXY+CiAgICAgIDxkaXYgaWQ9ImNvZGVMaXN0Ij48L2Rpdj4KICAgIDwvZGl2PgogIDwvZGl2Pgo8L2Rpdj4KPHNjcmlwdD4KY29uc3QgQVBJID0gJy9hcGkvYWRtaW4nOwpsZXQgdG9rZW4gPSAnJzsKZnVuY3Rpb24gbG9naW4oKSB7CiAgdG9rZW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRtaW5LZXknKS52YWx1ZTsKICBmZXRjaChBUEkrJy9saXN0JywgeyBtZXRob2Q6J1BPU1QnLCBoZWFkZXJzOnsnQ29udGVudC1UeXBlJzonYXBwbGljYXRpb24vanNvbid9LCBib2R5OkpTT04uc3RyaW5naWZ5KHthZG1pbktleTp0b2tlbn0pIH0pCiAgICAudGhlbihyID0+IHsgaWYoIXIub2spIHRocm93IEVycm9yKCk7IHJldHVybiByLmpzb24oKTsgfSkKICAgIC50aGVuKGQgPT4gewogICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9naW5Cb3gnKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOwogICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRtaW5QYW5lbCcpLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snOwogICAgICByZW5kZXJDb2RlcyhkKTsKICAgICAgcmVuZGVyU3RhdHMoZCk7CiAgICB9KQogICAgLmNhdGNoKCgpID0+IGFsZXJ0KCflr4bnoIHplJnor68nKSk7Cn0KZnVuY3Rpb24gZ2VuZXJhdGVDb2RlcygpIHsKICBjb25zdCBkYXlzID0gcGFyc2VJbnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RheXMnKS52YWx1ZSk7CiAgY29uc3QgY291bnQgPSBwYXJzZUludChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY291bnQnKS52YWx1ZSkgfHwgMTsKICBjb25zdCBtZW1vID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lbW8nKS52YWx1ZTsKICBjb25zdCBidG4gPSBldmVudC50YXJnZXQ7IGJ0bi5kaXNhYmxlZCA9IHRydWU7IGJ0bi50ZXh0Q29udGVudCA9ICfnlJ/miJDkuK0uLi4nOwogIGZldGNoKEFQSSsnL2dlbmVyYXRlJywgeyBtZXRob2Q6J1BPU1QnLCBoZWFkZXJzOnsnQ29udGVudC1UeXBlJzonYXBwbGljYXRpb24vanNvbid9LCBib2R5OkpTT04uc3RyaW5naWZ5KHthZG1pbktleTp0b2tlbiwgZGF5cywgY291bnQsIG1lbW99KSB9KQogICAgLnRoZW4ociA9PiByLmpzb24oKSkKICAgIC50aGVuKGQgPT4gewogICAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ2VuUmVzdWx0Jyk7CiAgICAgIGlmIChkLmNvZGVzKSB7CiAgICAgICAgZGl2LmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJiYXRjaC1yZXN1bHQiPjxzdHJvbmc+5bey55Sf5oiQICcgKyBkLmNvZGVzLmxlbmd0aCArICcg5Liq5r+A5rS756CBPC9zdHJvbmc+PGJyPuacieaViOacnzogJyArIGQuZGF5cyArICcg5aSpPGJyPjxkaXYgY2xhc3M9ImNvZGVzIj4nICsgZC5jb2Rlcy5qb2luKCc8YnI+JykgKyAnPC9kaXY+PC9kaXY+JzsKICAgICAgfSBlbHNlIHsKICAgICAgICBkaXYuaW5uZXJIVE1MID0gJzxkaXYgc3R5bGU9ImNvbG9yOnJlZCI+JyArIChkLmVycm9yfHwn55Sf5oiQ5aSx6LSlJykgKyAnPC9kaXY+JzsKICAgICAgfQogICAgICBsb2FkQ29kZXMoKTsKICAgIH0pCiAgICAuZmluYWxseSgoKSA9PiB7IGJ0bi5kaXNhYmxlZCA9IGZhbHNlOyBidG4udGV4dENvbnRlbnQgPSAn55Sf5oiQJzsgfSk7Cn0KZnVuY3Rpb24gbG9hZENvZGVzKCkgewogIGZldGNoKEFQSSsnL2xpc3QnLCB7IG1ldGhvZDonUE9TVCcsIGhlYWRlcnM6eydDb250ZW50LVR5cGUnOidhcHBsaWNhdGlvbi9qc29uJ30sIGJvZHk6SlNPTi5zdHJpbmdpZnkoe2FkbWluS2V5OnRva2VufSkgfSkKICAgIC50aGVuKHIgPT4gci5qc29uKCkpCiAgICAudGhlbihkID0+IHsgcmVuZGVyQ29kZXMoZCk7IHJlbmRlclN0YXRzKGQpOyB9KTsKfQpmdW5jdGlvbiByZW5kZXJDb2RlcyhkKSB7CiAgY29uc3QgbGlzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb2RlTGlzdCcpOwogIGlmICghZC5jb2RlcyB8fCAhZC5jb2Rlcy5sZW5ndGgpIHsgbGlzdC5pbm5lckhUTUwgPSAnPGRpdiBzdHlsZT0idGV4dC1hbGlnbjpjZW50ZXI7cGFkZGluZzoyMHB4O2NvbG9yOiM2NDc0OGI7Ij7mmoLml6Dmv4DmtLvnoIE8L2Rpdj4nOyByZXR1cm47IH0KICBsaXN0LmlubmVySFRNTCA9IGQuY29kZXMuc29ydCgoYSxiKT0+bmV3IERhdGUoYi5jcmVhdGVkKS1uZXcgRGF0ZShhLmNyZWF0ZWQpKS5tYXAoYyA9PiB7CiAgICBsZXQgc3RhdHVzID0gJ3VudXNlZCcsIGxhYmVsID0gJ+acqua/gOa0uyc7CiAgICBpZiAoYy5hY3RpdmF0ZWQpIHsgc3RhdHVzID0gJ2FjdGl2YXRlZCc7IGxhYmVsID0gJ+W3sua/gOa0uyc7IH0KICAgIGVsc2UgaWYgKG5ldyBEYXRlKGMuZXhwaXJlcykgPCBuZXcgRGF0ZSgpKSB7IHN0YXR1cyA9ICdleHBpcmVkJzsgbGFiZWwgPSAn5bey6L+H5pyfJzsgfQogICAgbGV0IGRldGFpbCA9IChjLm1lbW98fCcnKSArICcgLyAnICsgYy5jcmVhdGVkICsgJyDoh7MgJyArIGMuZXhwaXJlczsKICAgIGlmIChjLmZpcnN0VXNlZEF0KSBkZXRhaWwgKz0gJyAvIOmmluasoTogJyArIGMuZmlyc3RVc2VkQXQ7CiAgICBpZiAoYy5sYXN0VXNlZEF0KSBkZXRhaWwgKz0gJyAvIOacgOi/kTogJyArIGMubGFzdFVzZWRBdDsKICAgIHJldHVybiAnPGRpdiBjbGFzcz0iY29kZS1pdGVtIj48ZGl2PjxkaXYgY2xhc3M9ImNvZGUiPicgKyBjLmNvZGUgKyAnPC9kaXY+PGRpdiBzdHlsZT0iZm9udC1zaXplOjEycHg7Y29sb3I6IzY0NzQ4YjsiPicgKyBkZXRhaWwgKyAnPC9kaXY+PC9kaXY+PHNwYW4gY2xhc3M9InN0YXR1cyAnICsgc3RhdHVzICsgJyI+JyArIGxhYmVsICsgJzwvc3Bhbj48L2Rpdj4nOwogIH0pLmpvaW4oJycpOwp9CmZ1bmN0aW9uIHJlbmRlclN0YXRzKGQpIHsKICBpZiAoIWQuY29kZXMpIHJldHVybjsKICBjb25zdCB0b3RhbCA9IGQuY29kZXMubGVuZ3RoOwogIGNvbnN0IGFjdGl2YXRlZCA9IGQuY29kZXMuZmlsdGVyKGZ1bmN0aW9uKGMpIHsgcmV0dXJuIGMuYWN0aXZhdGVkOyB9KS5sZW5ndGg7CiAgY29uc3QgYWN0aXZlID0gZC5jb2Rlcy5maWx0ZXIoZnVuY3Rpb24oYykgeyByZXR1cm4gIWMuYWN0aXZhdGVkICYmIG5ldyBEYXRlKGMuZXhwaXJlcykgPj0gbmV3IERhdGUoKTsgfSkubGVuZ3RoOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdGF0cycpLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJzdGF0LWl0ZW0iPjxkaXYgY2xhc3M9Im51bSI+JyArIHRvdGFsICsgJzwvZGl2PjxkaXYgY2xhc3M9ImxhYmVsIj7mgLvnlJ/miJA8L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPSJzdGF0LWl0ZW0iPjxkaXYgY2xhc3M9Im51bSI+JyArIGFjdGl2YXRlZCArICc8L2Rpdj48ZGl2IGNsYXNzPSJsYWJlbCI+5bey5r+A5rS7PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz0ic3RhdC1pdGVtIj48ZGl2IGNsYXNzPSJudW0iPicgKyBhY3RpdmUgKyAnPC9kaXY+PGRpdiBjbGFzcz0ibGFiZWwiPuacqua/gOa0u+acieaViDwvZGl2PjwvZGl2Pic7Cn0KPC9zY3JpcHQ+CjwvYm9keT4KPC9odG1sPgo=';
function getAdminPage() {
  try {
    const adminPath = path.join(__dirname, 'admin.html');
    if (fs.existsSync(adminPath)) {
      return fs.readFileSync(adminPath, 'utf-8');
    }
  } catch(e) { /* ignore */ }
  return Buffer.from(ADMIN_HTML_BASE64, 'base64').toString('utf-8');
}

app.get('/admin', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(getAdminPage());
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`高考志愿助手启动成功: http://localhost:${PORT}`);
  console.log(`已加载 ${Object.keys(GAOKAO_DATA).length} 所院校数据`);
  console.log(`AI 分析: ${DEEPSEEK_API_KEY ? '已启用' : '未配置（需设置 DEEPSEEK_API_KEY）'}`);
  console.log(`激活码管理: ${ADMIN_KEY !== 'admin888' ? '已配置' : '使用默认密钥'}`);
});
