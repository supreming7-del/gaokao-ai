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
      const diff = c.min_rank - rankNum;
      if (diff > 300 && diff <= 3500) {
        const prob = Math.round(15 + (1 - (diff - 300) / 3200) * 25);
        chong.push({ school: c.school, min_rank: c.min_rank, min_score: c.min_score, majors: pickMajors(c.school), probability: prob + '%', type: '冲', diff });
      } else if (diff >= -500 && diff <= 300) {
        const prob = Math.round(55 + (1 - Math.abs(diff) / 800) * 20);
        wen.push({ school: c.school, min_rank: c.min_rank, min_score: c.min_score, majors: pickMajors(c.school), probability: prob + '%', type: '稳', diff });
      } else if (diff < -800) {
        const prob = Math.round(85 + Math.min(Math.abs(diff) / 5000, 0.13) * 100);
        bao.push({ school: c.school, min_rank: c.min_rank, min_score: c.min_score, majors: pickMajors(c.school), probability: Math.min(prob, 99) + '%', type: '保', diff });
      }
    }
  } else {
    for (const c of candidates) {
      if (!c.min_score) continue;
      const diff = c.min_score - score;
      if (diff > 0 && diff <= 20) {
        chong.push({ school: c.school, min_rank: c.min_rank, min_score: c.min_score, majors: pickMajors(c.school), probability: '30%', type: '冲', diff });
      } else if (diff >= -10 && diff <= 0) {
        wen.push({ school: c.school, min_rank: c.min_rank, min_score: c.min_score, majors: pickMajors(c.school), probability: '65%', type: '稳', diff });
      } else if (diff < -10) {
        bao.push({ school: c.school, min_rank: c.min_rank, min_score: c.min_score, majors: pickMajors(c.school), probability: '90%', type: '保', diff });
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

function pickMajors(school) {
  const majorMap = {
    '计算机': ['计算机科学与技术', '软件工程', '人工智能', '数据科学与大数据技术', '物联网工程'],
    '电子': ['电子信息工程', '通信工程', '微电子科学与工程', '光电信息科学与工程'],
    '机械': ['机械设计制造及其自动化', '自动化', '机器人工程', '智能制造工程'],
    '土木': ['土木工程', '建筑学', '城乡规划', '水利水电工程'],
    '经管': ['会计学', '金融学', '工商管理', '经济学', '财务管理'],
    '文法': ['法学', '汉语言文学', '新闻学', '英语', '行政管理'],
    '医学': ['临床医学', '护理学', '药学', '医学影像学', '口腔医学'],
    '教育': ['教育学', '学前教育', '小学教育', '数学与应用数学'],
    '艺术': ['视觉传达设计', '环境设计', '数字媒体艺术', '动画'],
    '农林': ['农学', '园艺', '动物医学', '林学', '食品科学与工程']
  };

  let categories = ['经管', '文法'];
  if (school.includes('师范')) categories = ['教育', '文法'];
  else if (school.includes('医')) categories = ['医学'];
  else if (school.includes('农业') || school.includes('林业') || school.includes('农林')) categories = ['农林'];
  else if (school.includes('财经') || school.includes('商贸') || school.includes('经济')) categories = ['经管'];
  else if (school.includes('政法') || school.includes('法学')) categories = ['文法'];
  else if (school.includes('艺术') || school.includes('传媒')) categories = ['艺术'];
  else if (school.includes('理工') || school.includes('科技') || school.includes('交通') || school.includes('工业'))
    categories = ['计算机', '电子', '机械'];
  else if (school.includes('民族')) categories = ['文法', '教育', '经管'];
  else if (school.includes('石油') || school.includes('地质') || school.includes('矿业'))
    categories = ['机械', '土木'];
  else if (school.includes('电力') || school.includes('水利')) categories = ['电子', '土木'];

  const allMajors = [...new Set(categories.flatMap(c => majorMap[c] || []))];
  const shuffled = allMajors.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(3, shuffled.length));
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

  let analysisType = '冲一冲';
  if (schoolItem.type === '稳') analysisType = '稳妥选择';
  else if (schoolItem.type === '保') analysisType = '保底选择';

  const prompt = `请作为高考志愿专家，为考生分析以下推荐院校（100字以内）：

考生信息：${userInfo.subjectType}，${userInfo.rank ? '位次' + userInfo.rank + '名' : userInfo.score + '分'}
推荐院校：${schoolItem.school}
2025年录取数据：最低位次${schoolItem.min_rank}名${schoolItem.min_score ? '，最低分' + schoolItem.min_score : ''}
推荐梯度：${analysisType}（位次相差${absDiff}名）

请从以下三方面简短分析：
1️⃣ 学校层次定位（985/211/双一流/省重点/普通本科/专科）
2️⃣ 录取概率判断
3️⃣ 志愿填报建议（第几梯度、是否服从调剂等）`;

  return await callDeepSeek(prompt, 300);
}

// 生成完整AI填报报告
async function generateFullReport(userInfo, chong, wen, bao) {
  const chongNames = chong.slice(0, 3).map(s => s.school).join('、');
  const wenNames = wen.slice(0, 3).map(s => s.school).join('、');
  const baoNames = bao.slice(0, 3).map(s => s.school).join('、');

  const prompt = `你是一位资深高考志愿填报专家。请根据以下信息，为考生生成一份完整的志愿填报分析报告（200字以内）：

考生：${userInfo.subjectType}，${userInfo.rank ? '位次' + userInfo.rank + '名' : userInfo.score + '分'}

冲刺院校：${chongNames || '无'}
稳妥院校：${wenNames || '无'}
保底院校：${baoNames || '无'}

请包含：
1️⃣ 整体策略建议（冲稳保如何搭配）
2️⃣ 最容易"捡漏"的院校点评
3️⃣ 填报注意事项（如专业是否服从调剂）
4️⃣ 给考生的最后建议`;

  return await callDeepSeek(prompt, 500);
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
    used: false,
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
  if (entry.used) return { valid: false, reason: '该激活码已被使用' };
  if (Date.now() > entry.expires) return { valid: false, reason: '激活码已过期（' + new Date(entry.expires).toLocaleDateString('zh-CN') + '）' };
  return { valid: true, expires: entry.expires };
}

function markCodeUsed(code) {
  // 管理员永久码不标记已使用
  if (MASTER_CODE && code === MASTER_CODE) return;

  const codes = loadCodes();
  if (codes[code]) {
    codes[code].used = true;
    codes[code].usedAt = Date.now();
    saveCodes(codes);
  }
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
    const { province, score, rank, subjectType, subjects, chatMode, chatQuestion } = req.body;

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
    const { schools, userInfo } = req.body;

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
    const { userInfo, chong, wen, bao } = req.body;
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
    markCodeUsed(code.trim().toUpperCase());
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
  res.json({ codes, days: days || 3, note: '每个激活码限使用一次，过期自动失效' });
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
    used: info.used,
    memo: info.memo || ''
  }));
  res.json({ total: list.length, codes: list });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 高考志愿助手启动成功: http://localhost:${PORT}`);
  console.log(`📊 已加载 ${Object.keys(GAOKAO_DATA).length} 所院校数据`);
  console.log(`🤖 AI 分析: ${DEEPSEEK_API_KEY ? '已启用' : '未配置（需设置 DEEPSEEK_API_KEY）'}`);
  console.log(`🔑 激活码管理: ${ADMIN_KEY !== 'admin888' ? '已配置' : '使用默认密钥'}`);
});
