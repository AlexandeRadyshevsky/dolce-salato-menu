// SQLite: контакты, заявки и сегменты.
//   contacts          — одна карточка на e-mail (main list = все контакты)
//   requests          — каждая заявка с сайта (история, категории, дата)
//   contact_segments  — сегменты контакта: категории, по которым он запрашивал прайс
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS contacts (
  id               INTEGER PRIMARY KEY,
  email            TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name             TEXT,
  company          TEXT,
  phone            TEXT,
  consent_at       TEXT NOT NULL,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  sync_status      TEXT NOT NULL DEFAULT 'pending',   -- pending | ok | error | off
  sync_error       TEXT,
  synced_at        TEXT
);
CREATE TABLE IF NOT EXISTS requests (
  id               INTEGER PRIMARY KEY,
  contact_id       INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  name             TEXT,
  company          TEXT,
  phone            TEXT,
  categories       TEXT NOT NULL DEFAULT '[]',        -- JSON: id категорий
  product          TEXT,
  comment          TEXT,
  page             TEXT,
  ip               TEXT,
  user_agent       TEXT,
  created_at       TEXT NOT NULL,
  mail_status      TEXT NOT NULL DEFAULT 'pending'    -- pending | ok | error | off
);
CREATE TABLE IF NOT EXISTS contact_segments (
  contact_id       INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  segment          TEXT NOT NULL,                     -- 'main' или id категории
  created_at       TEXT NOT NULL,
  PRIMARY KEY (contact_id, segment)
);
CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at);
CREATE INDEX IF NOT EXISTS idx_segments_segment ON contact_segments(segment);
`;

export function openDb(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return createRepo(db);
}

const now = () => new Date().toISOString();

function createRepo(db) {
  const findContact = db.prepare('SELECT * FROM contacts WHERE email = ?');
  const insertContact = db.prepare(`INSERT INTO contacts (email, name, company, phone, consent_at, created_at, updated_at)
    VALUES (@email, @name, @company, @phone, @at, @at, @at)`);
  const updateContact = db.prepare(`UPDATE contacts SET name = @name, company = @company, phone = @phone,
    consent_at = @at, updated_at = @at, sync_status = 'pending' WHERE id = @id`);
  const insertRequest = db.prepare(`INSERT INTO requests
    (contact_id, name, company, phone, categories, product, comment, page, ip, user_agent, created_at)
    VALUES (@contact_id, @name, @company, @phone, @categories, @product, @comment, @page, @ip, @user_agent, @at)`);
  const insertSegment = db.prepare(
    'INSERT OR IGNORE INTO contact_segments (contact_id, segment, created_at) VALUES (?, ?, ?)'
  );
  const segmentsOf = db.prepare('SELECT segment FROM contact_segments WHERE contact_id = ? ORDER BY created_at');

  /* Сохраняет заявку: карточка контакта (по e-mail) + заявка + сегменты.
     Повторная заявка того же e-mail обновляет карточку и добавляет новые сегменты. */
  const saveRequest = db.transaction((r) => {
    const at = now();
    const row = { email: r.email, name: r.name, company: r.company, phone: r.phone, at };
    let contact = findContact.get(r.email);
    if (contact) updateContact.run({ ...row, id: contact.id });
    else insertContact.run(row);
    contact = findContact.get(r.email);

    const req = insertRequest.run({
      contact_id: contact.id,
      name: r.name,
      company: r.company,
      phone: r.phone,
      categories: JSON.stringify(r.categories),
      product: r.product || null,
      comment: r.comment || null,
      page: r.page || null,
      ip: r.ip || null,
      user_agent: r.userAgent || null,
      at,
    });
    for (const seg of ['main', ...r.categories]) insertSegment.run(contact.id, seg, at);
    return { contactId: contact.id, requestId: Number(req.lastInsertRowid) };
  });

  return {
    raw: db,
    saveRequest,
    contact: (id) => db.prepare('SELECT * FROM contacts WHERE id = ?').get(id),
    request: (id) => db.prepare('SELECT * FROM requests WHERE id = ?').get(id),
    segments: (contactId) => segmentsOf.all(contactId).map((s) => s.segment),
    setSync(contactId, status, error = null) {
      db.prepare('UPDATE contacts SET sync_status = ?, sync_error = ?, synced_at = ? WHERE id = ?').run(
        status,
        error,
        status === 'ok' ? now() : null,
        contactId
      );
    },
    setMail(requestId, status) {
      db.prepare('UPDATE requests SET mail_status = ? WHERE id = ?').run(status, requestId);
    },
    pendingSync: () => db.prepare("SELECT id FROM contacts WHERE sync_status IN ('pending','error') ORDER BY id").all(),
    segmentCounts: () =>
      db.prepare('SELECT segment, COUNT(*) AS contacts FROM contact_segments GROUP BY segment ORDER BY contacts DESC').all(),
    /* Контакты сегмента ('main' — все) с последней датой заявки */
    exportSegment(segment = 'main') {
      return db
        .prepare(
          `SELECT c.id, c.email, c.name, c.company, c.phone, c.created_at, c.updated_at, c.sync_status,
                  (SELECT GROUP_CONCAT(segment, ',') FROM contact_segments s2
                     WHERE s2.contact_id = c.id AND s2.segment != 'main') AS segments,
                  (SELECT MAX(created_at) FROM requests r WHERE r.contact_id = c.id) AS last_request_at,
                  (SELECT COUNT(*) FROM requests r WHERE r.contact_id = c.id) AS requests
             FROM contacts c JOIN contact_segments s ON s.contact_id = c.id AND s.segment = ?
            ORDER BY last_request_at DESC`
        )
        .all(segment);
    },
  };
}
