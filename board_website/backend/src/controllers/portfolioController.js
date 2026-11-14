const { db } = require('../database/db');
const { calculateGamification } = require('./learningsController');

function findUserAndProfileBySlug(slug) {
  if (!slug) return null;
  const cleanSlug = String(slug).trim().toLowerCase();

  // 1. Try matching resume_profile.portfolio_slug
  let prof = db.prepare(`
    SELECT * FROM resume_profile 
    WHERE LOWER(portfolio_slug) = ? 
    LIMIT 1
  `).get(cleanSlug);

  let user = null;
  if (prof) {
    user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(prof.user_id);
  } else {
    // 2. Try matching users.portfolio_slug or users.id
    user = db.prepare(`
      SELECT * 
      FROM users 
      WHERE LOWER(portfolio_slug) = ? OR LOWER(id) = ?
      LIMIT 1
    `).get(cleanSlug, cleanSlug);

    if (user) {
      prof = db.prepare(`SELECT * FROM resume_profile WHERE user_id = ? LIMIT 1`).get(user.id);
    }
  }

  if (!prof && !user) return null;

  const isPublic = Boolean(prof?.is_portfolio_public || user?.is_portfolio_public);
  const targetUserId = prof?.user_id || user?.id;

  return { prof, user, isPublic, targetUserId, slug: cleanSlug };
}

exports.getPublicPortfolio = (req, res, next) => {
  try {
    const slug = req.params.slug;
    const data = findUserAndProfileBySlug(slug);

    if (!data || !data.isPublic) {
      return res.status(404).json({ error: 'Portfolio not found or set to private.' });
    }

    const { prof, user, targetUserId } = data;
    const userTz = user?.timezone || 'Asia/Kolkata';

    // 1. Calculate live streak and gamification
    let gamification = null;
    try {
      gamification = calculateGamification(targetUserId, userTz);
    } catch (_) {
      gamification = {
        streak: 0,
        longestStreak: 0,
        level: 1,
        levelTitle: 'Novice Scout',
        levelIcon: 'Sprout',
        totalXP: 0,
        totalDsaSolved: 0,
        learningCount: 0,
        weekPunchcard: []
      };
    }

    // 2. Query solved DSA problems & repetition mastery
    const dsaRows = db.prepare(`
      SELECT problem_id, repetition_stage, updated_at 
      FROM dsa_progress 
      WHERE user_id = ? AND status = 'solved'
    `).all(targetUserId);

    const masteredCount = dsaRows.filter(r => (r.repetition_stage ?? 0) >= 4).length;

    // 3. Query verified latest resume
    const resumeVersion = db.prepare(`
      SELECT id, label, pdf_name, (pdf_data IS NOT NULL AND pdf_data != '') as has_pdf 
      FROM resume_versions 
      WHERE user_id = ? AND pdf_data IS NOT NULL AND pdf_data != '' 
      ORDER BY id DESC LIMIT 1
    `).get(targetUserId);

    // 4. Query recent public technical learnings (topics studied, category, date)
    let publicLearnings = [];
    try {
      publicLearnings = db.prepare(`
        SELECT id, title, topic, category, date_logged as date, tags, duration_minutes 
        FROM learnings 
        WHERE user_id = ? 
        ORDER BY date_logged DESC, id DESC LIMIT 6
      `).all(targetUserId);
    } catch (_) {}

    res.json({
      ok: 1,
      slug: data.slug,
      user: {
        name: prof?.full_name || user?.name || 'Developer',
        headline: prof?.portfolio_headline || user?.portfolio_headline || '',
        bio: prof?.portfolio_bio || user?.portfolio_bio || '',
        avatar_url: user?.avatar_url || '',
        linkedin: prof?.linkedin || '',
        github: prof?.github || '',
        email: prof?.email || user?.email || '',
        school: prof?.school || '',
        degree: prof?.degree || '',
        grad_date: prof?.grad_date || '',
        skills: prof?.skills || '',
        projects: prof?.projects || '',
        experience: prof?.experience || '',
      },
      stats: {
        streak: gamification.streak || 0,
        longestStreak: gamification.longestStreak || 0,
        level: gamification.level || 1,
        levelTitle: gamification.levelTitle || 'Novice Scout',
        levelIcon: gamification.levelIcon || 'Sprout',
        totalXP: gamification.totalXP || 0,
        totalDsaSolved: dsaRows.length,
        masteredDsaCount: masteredCount,
        learningCount: gamification.learningCount || 0,
        weekPunchcard: gamification.weekPunchcard || [],
      },
      dsa: {
        solvedProblemIds: dsaRows.map(r => ({
          id: r.problem_id,
          repetition_stage: r.repetition_stage ?? 0
        })),
        masteredCount
      },
      recentLearnings: publicLearnings,
      resume: resumeVersion ? {
        hasPdf: Boolean(resumeVersion.has_pdf),
        name: resumeVersion.pdf_name || `${resumeVersion.label}.pdf`,
        downloadUrl: `/api/portfolio/${data.slug}/resume`
      } : null
    });
  } catch (err) {
    next(err);
  }
};

exports.downloadPublicResume = (req, res, next) => {
  try {
    const slug = req.params.slug;
    const data = findUserAndProfileBySlug(slug);

    if (!data || !data.isPublic) {
      return res.status(404).json({ error: 'Portfolio not found or set to private.' });
    }

    const { targetUserId } = data;
    const r = db.prepare(`
      SELECT pdf_name, label, pdf_data 
      FROM resume_versions 
      WHERE user_id = ? AND pdf_data IS NOT NULL AND pdf_data != '' 
      ORDER BY id DESC LIMIT 1
    `).get(targetUserId);

    if (!r || !r.pdf_data) {
      return res.status(404).json({ error: 'Verified resume PDF is not currently available.' });
    }

    const dataStr = r.pdf_data.includes(',') ? r.pdf_data.split(',')[1] : r.pdf_data;
    const pdfBuffer = Buffer.from(dataStr, 'base64');
    if (!pdfBuffer.length) {
      return res.status(404).json({ error: 'PDF file is empty.' });
    }

    const filename = r.pdf_name || `${r.label || 'Resume'}.pdf`;
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`
    });
    res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

exports.checkSlugAvailability = (req, res, next) => {
  try {
    const currentUserId = req.user?.id || null;
    const slug = (req.query.slug || '').trim().toLowerCase();

    if (!slug) {
      return res.json({ available: false, message: 'Slug cannot be empty' });
    }

    if (!/^[a-z0-9_-]{3,30}$/.test(slug)) {
      return res.json({
        available: false,
        message: 'Username must be 3-30 characters (letters, numbers, hyphens, underscores only).'
      });
    }

    const existingUser = db.prepare(`
      SELECT id FROM users WHERE LOWER(portfolio_slug) = ? AND id != ?
    `).get(slug, currentUserId || '');

    const existingProf = db.prepare(`
      SELECT user_id FROM resume_profile WHERE LOWER(portfolio_slug) = ? AND user_id != ?
    `).get(slug, currentUserId || '');

    const isAvailable = !existingUser && !existingProf;

    res.json({
      available: isAvailable,
      slug,
      message: isAvailable ? 'Username is available!' : 'Username is already claimed.'
    });
  } catch (err) {
    next(err);
  }
};
