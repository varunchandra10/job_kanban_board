const { db, runInTransaction } = require('../database/db');
const { calculateGamification } = require('./learningsController');

function getEffectiveUserId(req) {
  return req.user?.id || null;
}

/**
 * Universal 1-Click Job Clipper endpoint
 * Creates a job application card in the user's Kanban board from any website.
 */
exports.quickAdd = async (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    if (!userId) {
      return res.status(401).json({
        error: 'Please log in to your Job Tracker account',
        loggedOut: true
      });
    }

    const b = req.body || {};
    const company = (b.company || 'Unknown Company').trim();
    const role = (b.role || 'Software Engineer').trim();
    const stage = (b.stage || 'Applied').trim();
    const category = (b.category || 'Industry').trim();
    const deadline = (b.deadline || '').trim();
    const salary = (b.salary || '').trim();
    const currency = (
      b.currency ||
      (salary.includes('₹') || salary.toLowerCase().includes('lpa')
        ? 'INR'
        : salary.includes('€')
        ? 'EUR'
        : salary.includes('£')
        ? 'GBP'
        : 'USD')
    ).trim();
    const city = (b.city || '').trim();
    const country = (b.country || (currency === 'INR' ? 'IN' : 'US')).trim();
    const dateApplied = b.date_applied || new Date().toISOString().slice(0, 10);
    const jdUrl = (b.jd_url || b.url || '').trim();
    const jd = (b.jd || b.description || '').trim();
    const portalNotes = (b.portal_notes || b.notes || '').trim();
    const customTags = (
      b.custom_tags ||
      (b.tags ? (Array.isArray(b.tags) ? b.tags.join(', ') : b.tags) : 'Clipped')
    ).trim();
    const recruiterName = (b.recruiter_name || '').trim();
    const recruiterEmail = (b.recruiter_email || '').trim();
    let resumePath = (b.resume_path || '').trim();
    let coverLetterPath = (b.cover_letter_path || '').trim();
    const resumeVersionId = b.resume_version_id ? Number(b.resume_version_id) : null;
    const crypto = require('crypto');
    const createdDocIds = [];

    // Handle resume from clipper (existing link or base64 upload)
    if (b.resume_file && b.resume_file.existingLink) {
      resumePath = b.resume_file.existingLink;
    } else if (b.resume_file && b.resume_file.data) {
      try {
        const docId = `doc_${crypto.randomUUID()}`;
        const name = (b.resume_file.name || 'resume.pdf').trim();
        const dataStr = b.resume_file.data.includes(',') ? b.resume_file.data.split(',')[1] : b.resume_file.data;
        const mimeType = b.resume_file.mimeType || 'application/pdf';
        db.prepare(`
          INSERT INTO document_files (id, user_id, app_id, type, name, mime_type, data, created_at)
          VALUES (?, ?, NULL, 'resume', ?, ?, ?, datetime('now'))
        `).run(docId, userId, name, mimeType, dataStr);
        resumePath = `/api/document-content?doc_id=${docId}&name=${encodeURIComponent(name)}`;
        createdDocIds.push(docId);
      } catch (err) {
        console.warn('[Clipper Document Error - Resume]:', err.message);
      }
    }

    // Handle cover letter from clipper (existing link or base64 upload)
    if (b.cover_letter_file && b.cover_letter_file.existingLink) {
      coverLetterPath = b.cover_letter_file.existingLink;
    } else if (b.cover_letter_file && b.cover_letter_file.data) {
      try {
        const docId = `doc_${crypto.randomUUID()}`;
        const name = (b.cover_letter_file.name || 'cover_letter.pdf').trim();
        const dataStr = b.cover_letter_file.data.includes(',') ? b.cover_letter_file.data.split(',')[1] : b.cover_letter_file.data;
        const mimeType = b.cover_letter_file.mimeType || 'application/pdf';
        db.prepare(`
          INSERT INTO document_files (id, user_id, app_id, type, name, mime_type, data, created_at)
          VALUES (?, ?, NULL, 'cover_letter', ?, ?, ?, datetime('now'))
        `).run(docId, userId, name, mimeType, dataStr);
        coverLetterPath = `/api/document-content?doc_id=${docId}&name=${encodeURIComponent(name)}`;
        createdDocIds.push(docId);
      } catch (err) {
        console.warn('[Clipper Document Error - Cover Letter]:', err.message);
      }
    }

    // Shift existing cards in targetStage down by 1 so the new card is at position 0 (top)
    runInTransaction(() => {
      db.prepare("UPDATE applications SET position = position + 1 WHERE stage=? AND user_id=?").run(stage, userId);
    });

    const insertResult = db.prepare(`
      INSERT INTO applications (
        company, role, stage, position, category, deadline, salary, currency, city, country,
        date_applied, jd_url, jd, portal_notes, custom_tags, recruiter_name, recruiter_email,
        resume_version_id, resume_path, cover_letter_path, user_id
      ) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      company, role, stage, category, deadline, salary, currency, city, country,
      dateApplied, jdUrl, jd, portalNotes, customTags, recruiterName, recruiterEmail,
      resumeVersionId, resumePath, coverLetterPath, userId
    );

    const appId = Number(insertResult.lastInsertRowid);

    // Link any created document files to this new application
    if (createdDocIds.length > 0) {
      try {
        const updateDocStmt = db.prepare("UPDATE document_files SET app_id = ? WHERE id = ?");
        for (const docId of createdDocIds) {
          updateDocStmt.run(appId, docId);
        }
      } catch (docLinkErr) {
        console.warn('[Clipper Document Link Warning]:', docLinkErr.message);
      }
    }

    // Save into roles table if new
    if (role) {
      try {
        db.prepare("INSERT OR IGNORE INTO roles(name, user_id) VALUES (?, ?)").run(role, userId);
      } catch (_) {}
    }

    // Save into companies table if new
    if (company) {
      try {
        db.prepare("INSERT OR IGNORE INTO companies(name, user_id) VALUES (?, ?)").run(company, userId);
      } catch (_) {}
    }

    // Activity log entry
    try {
      db.prepare("INSERT INTO activity_log(app_id, type, detail, user_id) VALUES (?, 'created', ?, ?)").run(
        appId,
        `Clipped application for ${role} at ${company} (Stage: ${stage})`,
        userId
      );
    } catch (_) {}

    const created = db.prepare("SELECT * FROM applications WHERE id=? AND user_id=?").get(appId, userId);

    // Calculate updated streak and gamification
    let gamification = null;
    try {
      const tz = req.user?.timezone || req.query?.tz || 'Asia/Kolkata';
      gamification = calculateGamification(userId, tz);
    } catch (_) {}

    res.status(201).json({
      success: true,
      application: created,
      gamification,
      message: `Saved ${role} at ${company} to ${stage}!`
    });
  } catch (err) {
    next(err);
  }
};

