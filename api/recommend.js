// Vercel Serverless Function
// 基于2025年真实录取数据的甘肃高考志愿推荐引擎

const DATA = require('../gaokao-data.js');

// 甘肃省2025年分数线参考
const PROVINCE_LINES = {
  "甘肃": { "物理": { "本科批": 370, "专科批": 160 }, "历史": { "本科批": 421, "专科批": 160 } },
  "河南": { "物理": { "本科批": 396 }, "历史": { "本科批": 428 } },
  "山东": { "综合": { "一段": 443, "二段": 150 } },
  "四川": { "物理": { "本科批": 459 }, "历史": { "本科批": 457 } },
  "广东": { "物理": { "本科批": 439 }, "历史": { "本科批": 433 } },
  "陕西": { "物理": { "本科批": 397 }, "历史": { "本科批": 403 } }
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: '仅支持POST请求' });

  try {
    const { province, score, rank, subjectType, subjects, chatMode, chatQuestion, context } = req.body;

    if (!province || !score) {
      return res.status(400).json({ error: '请填写省份和分数', code: 'MISSING_PARAMS' });
    }

    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 750) {
      return res.status(400).json({ error: '请输入有效的分数（0-750）', code: 'INVALID_SCORE' });
    }

    // 聊天模式 - 返回简单回答
    if (chatMode && chatQuestion) {
      return res.json({ answer: generateChatAnswer(chatQuestion, context) });
    }

    // 推荐模式
    const result = generateRecommendation(province, scoreNum, rank, subjectType, subjects);
    return res.status(200).json(result);

  } catch (error) {
    console.error('Handler error:', error);
    const { province, score, rank, subjectType, subjects } = req.body || {};
    const fallback = generateRecommendation(
      province || '甘肃',
      parseInt(score) || 500,
      rank,
      subjectType || '物理类',
      subjects || '不限'
    );
    return res.status(200).json(fallback);
  }
}

function generateRecommendation(province, score, rank, subjectType, subjects) {
  // 科目映射
  const subjKey = subjectType === '物理类' ? '物理' : '历史';
  const rankNum = rank ? parseInt(rank) : null;

  // 收集所有符合条件的院校
  let candidates = [];

  for (const [school, subjectsData] of Object.entries(DATA)) {
    if (subjectsData[subjKey]) {
      const info = subjectsData[subjKey];
      // 有实际录取数据的才考虑
      if (info.r !== null && info.r !== undefined && info.r !== '') {
        candidates.push({
          school: school,
          min_rank: parseInt(info.r),
          min_score: info.s !== null && info.s !== '' ? parseInt(info.s) : null
        });
      }
    }
  }

  // 按位次排序
  candidates.sort((a, b) => a.min_rank - b.min_rank);

  let chong = [], wen = [], bao = [];

  if (rankNum) {
    // 基于位次的推荐
    for (const c of candidates) {
      const diff = c.min_rank - rankNum;
      if (diff > 300 && diff <= 3500) {
        // 冲：位次高300-3500名
        const prob = Math.round(15 + (1 - (diff - 300) / 3200) * 25);
        chong.push({ school: c.school, majors: pickMajors(c.school, subjKey), probability: prob + '%', reason: generateReason(c, '冲', prob, diff) });
      } else if (diff >= -500 && diff <= 300) {
        // 稳：位次相近
        const prob = Math.round(55 + (1 - Math.abs(diff) / 800) * 20);
        wen.push({ school: c.school, majors: pickMajors(c.school, subjKey), probability: prob + '%', reason: generateReason(c, '稳', prob, diff) });
      } else if (diff < -800) {
        // 保：位次低800+
        const prob = Math.round(85 + Math.min(Math.abs(diff) / 5000, 0.13) * 100);
        bao.push({ school: c.school, majors: pickMajors(c.school, subjKey), probability: Math.min(prob, 99) + '%', reason: generateReason(c, '保', Math.min(prob, 99), diff) });
      }
    }
  } else {
    // 基于分数的推荐（没有位次时）
    for (const c of candidates) {
      if (!c.min_score) continue;
      const diff = c.min_score - score;
      if (diff > 0 && diff <= 20) {
        chong.push({ school: c.school, majors: pickMajors(c.school, subjKey), probability: '30%', reason: '分数略低于该校往年录取线，建议冲刺' });
      } else if (diff >= -10 && diff <= 0) {
        wen.push({ school: c.school, majors: pickMajors(c.school, subjKey), probability: '65%', reason: '分数与往年录取线持平，录取概率较大' });
      } else if (diff < -10) {
        bao.push({ school: c.school, majors: pickMajors(c.school, subjKey), probability: '90%', reason: '分数高于往年线，录取把握大' });
      }
    }
  }

  // 限制每类推荐数量并去重
  chong = uniqueSchools(chong).slice(0, 5);
  wen = uniqueSchools(wen).slice(0, 5);
  bao = uniqueSchools(bao).slice(0, 5);

  // 如果某类不足3个，从其他类补充
  while (chong.length < 3 && wen.length > 0) {
    chong.push(wen.pop());
  }
  while (bao.length < 3 && wen.length > 0) {
    bao.push(wen.pop());
  }

  return {
    chong, wen, bao,
    summary: generateSummary(province, score, rankNum, subjKey, chong, wen, bao),
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

function generateReason(c, type, prob, diff) {
  const absDiff = Math.abs(diff);
  if (type === '冲') {
    return `2025年录取最低位次${c.min_rank}名，你的位次低${absDiff}名，有${prob}概率冲进。建议将该校作为第一梯度志愿。`;
  } else if (type === '稳') {
    return `2025年录取最低位次${c.min_rank}名，你的位次与其相差仅${absDiff}名，${prob}概率较大。建议作为核心志愿。`;
  } else {
    return `2025年录取最低位次${c.min_rank}名，你的位次高${absDiff}名，录取把握很大（${prob}%）。建议作为保底志愿。`;
  }
}

function pickMajors(school, subjKey) {
  // 按学科类别推荐主流专业
  const majorMap = {
    '计算机': ['计算机科学与技术', '软件工程', '人工智能', '数据科学与大数据技术', '物联网工程'],
    '电子': ['电子信息工程', '通信工程', '微电子科学与工程', '光电信息科学与工程'],
    '机械': ['机械设计制造及其自动化', '自动化', '机器人工程', '智能制造工程'],
    '土木': ['土木工程', '建筑学', '城乡规划', '水利水电工程'],
    '经管': ['会计学', '金融学', '工商管理', '经济学', '财务管理'],
    '文法': ['法学', '汉语言文学', '新闻学', '英语', '行政管理'],
    '医学': ['临床医学', '护理学', '药学', '医学影像学', '口腔医学'],
    '教育': ['教育学', '学前教育', '小学教育', '数学与应用数学', '汉语言文学'],
    '艺术': ['视觉传达设计', '环境设计', '数字媒体艺术', '动画'],
    '农林': ['农学', '园艺', '动物医学', '林学', '食品科学与工程']
  };

  // 根据学校名称特征选择专业类别
  let categories = ['经管', '文法'];
  if (school.includes('师范')) categories = ['教育', '文法'];
  else if (school.includes('医')) categories = ['医学'];
  else if (school.includes('农业') || school.includes('林业') || school.includes('农林')) categories = ['农林'];
  else if (school.includes('财经') || school.includes('商贸') || school.includes('经济')) categories = ['经管'];
  else if (school.includes('政法') || school.includes('法学')) categories = ['文法'];
  else if (school.includes('艺术') || school.includes('传媒') || school.includes('美术')) categories = ['艺术'];
  else if (school.includes('理工') || school.includes('科技') || school.includes('交通') || school.includes('工业'))
    categories = ['计算机', '电子', '机械'];
  else if (school.includes('民族')) categories = ['文法', '教育', '经管'];
  else if (school.includes('石油') || school.includes('地质') || school.includes('矿业'))
    categories = ['机械', '土木'];
  else if (school.includes('电力') || school.includes('水利')) categories = ['电子', '土木'];
  else if (school.includes('工程') || school.includes('航空')) categories = ['机械', '电子', '计算机'];

  // 随机选2-3个专业
  const allMajors = categories.flatMap(c => majorMap[c] || []);
  const shuffled = allMajors.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(3, shuffled.length));
}

function generateSummary(province, score, rankNum, subjKey, chong, wen, bao) {
  const total = chong.length + wen.length + bao.length;
  let summary = `根据2025年甘肃省${subjKey === '物理' ? '物理类' : '历史类'}录取数据，`;

  if (rankNum) {
    summary += `你的位次${rankNum}名`;
  } else {
    summary += `你的${score}分`;
  }

  if (total > 0) {
    summary += `，共推荐${total}所院校（冲${chong.length}所、稳${wen.length}所、保${bao.length}所）。`;
    summary += '建议按"冲-稳-保"梯度合理搭配：冲刺院校选1-2所、稳妥院校选3-4所、保底院校选2-3所，以最大限度降低滑档风险。';
  } else {
    summary += '，暂未匹配到完全合适的院校。建议联系省教育考试院获取官方志愿指导，或尝试调整目标批次范围。';
  }

  return summary;
}

function generateChatAnswer(question, context) {
  // 简单的本地回答
  const q = question.toLowerCase();
  if (q.includes('什么专业') || q.includes('选专业') || q.includes('专业好')) {
    return '选择专业时建议考虑：1）个人兴趣与能力特长；2）专业就业前景与行业趋势（如计算机、人工智能、新能源等方向持续向好）；3）院校学科实力（国家重点学科、硕博点、师资力量等）；4）地域因素（一线城市实习机会多但生活成本高）。建议结合自身情况综合权衡。';
  }
  if (q.includes('学校好') || q.includes('对比') || q.includes('哪个')) {
    if (context && context.chong && context.chong.length > 0) {
      const schools = context.chong.slice(0, 3).map(s => s.school).join('、');
      return `以上推荐中${schools}等院校各有优势。建议从学校层次（985/211/双一流）、学科评估等级、地域发展前景、往年录取位次稳定性等维度综合比较。具体可查阅各校官网招生章程和学科评估结果。`;
    }
    return '对比院校时建议关注：1）学校层次（985/211/双一流）；2）目标专业的学科评估等级；3）就业质量报告；4）地理位置与发展前景。';
  }
  if (q.includes('就业') || q.includes('工作')) {
    return '当前就业市场持续向好的方向包括：人工智能与大数据、新能源与碳中和、生物医药、集成电路、智能制造等。传统工科（机械、土木等）需求稳定但竞争加剧，文科类专业建议关注复合型技能培养（如法学+数据分析、外语+跨境电商等）。';
  }
  return '建议结合自身兴趣、分数位次和地域偏好综合选择。也可以查阅教育部"阳光高考"平台获取更多官方信息。如有具体院校或专业想了解，可以直接问我！';
}
