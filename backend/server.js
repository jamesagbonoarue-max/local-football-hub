const bcrypt = require('bcryptjs')
const crypto = require('node:crypto')
const cors = require('cors')
const express = require('express')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
require('dotenv').config()

const app = express()
const port = Number(process.env.PORT) || 5000
const maxActiveTeams = 70
const jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex')
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/local_football_league'
const frontendOrigins = String(process.env.FRONTEND_ORIGINS || 'https://big-boys-fc.vercel.app,http://127.0.0.1:5174,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const accountSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  adminIdHash: { type: String, select: false },
  verifiedAt: { type: Date, default: Date.now },
}, { timestamps: true })
const matchSchema = new mongoose.Schema({
  homeTeam: { type: String, required: true, trim: true, maxlength: 80 },
  awayTeam: { type: String, required: true, trim: true, maxlength: 80 },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  kickoff: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  venue: { type: String, trim: true, maxlength: 120, default: '' },
  status: { type: String, enum: ['scheduled', 'completed'], default: 'scheduled' },
  homeScore: { type: Number, min: 0, max: 99, default: null },
  awayScore: { type: Number, min: 0, max: 99, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
}, { timestamps: true })
const leagueUpdateSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  body: { type: String, required: true, trim: true, maxlength: 1200 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
}, { timestamps: true })
const registrationSchema = new mongoose.Schema({
  teamName: { type: String, required: true, trim: true, maxlength: 80 },
  division: { type: String, required: true, trim: true, maxlength: 60 },
  managerName: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
  phone: { type: String, trim: true, maxlength: 40, default: '' },
  homeGround: { type: String, trim: true, maxlength: 100, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
}, { timestamps: true })
const leagueCapacitySchema = new mongoose.Schema({
  _id: { type: String, required: true },
  activeTeams: { type: Number, required: true, min: 0 },
}, { versionKey: false })
const invitationSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 80 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 160 },
  verificationCodeHash: { type: String, required: true, select: false },
  adminIdHash: { type: String, required: true, select: false },
  adminIdEncrypted: { type: String, required: true, select: false },
  verificationAttempts: { type: Number, default: 0 },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  expiresAt: { type: Date, required: true },
  acceptedAt: { type: Date, default: null },
}, { timestamps: true })
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
const passwordResetSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  codeHash: { type: String, required: true, select: false },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true })
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const Account = mongoose.models.Account || mongoose.model('Account', accountSchema)
const Match = mongoose.models.Match || mongoose.model('Match', matchSchema)
const LeagueUpdate = mongoose.models.LeagueUpdate || mongoose.model('LeagueUpdate', leagueUpdateSchema)
const TeamRegistration = mongoose.models.TeamRegistration || mongoose.model('TeamRegistration', registrationSchema)
const LeagueCapacity = mongoose.models.LeagueCapacity || mongoose.model('LeagueCapacity', leagueCapacitySchema)
const AdminInvitation = mongoose.models.AdminInvitation || mongoose.model('AdminInvitation', invitationSchema)
const PasswordReset = mongoose.models.PasswordReset || mongoose.model('PasswordReset', passwordResetSchema)

app.use(cors({ origin: frontendOrigins.length ? frontendOrigins : true }))
app.use(express.json({ limit: '20kb' }))

function hashSecret(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex')
}

function matchesHash(value, expectedHash) {
  if (!expectedHash) return false
  const expected = Buffer.from(expectedHash, 'hex')
  const actual = Buffer.from(hashSecret(value || ''), 'hex')
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}

function encryptSecret(value) {
  const key = crypto.createHash('sha256').update(jwtSecret).digest()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('hex')).join('.')
}

function decryptSecret(value) {
  const [ivHex, tagHex, encryptedHex] = value.split('.')
  const key = crypto.createHash('sha256').update(jwtSecret).digest()
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8')
}

function safeUser(account, role = account.role) {
  return { id: account._id.toString(), name: account.name, email: account.email, role }
}

function safeMatch(match) {
  return {
    id: match._id.toString(),
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    date: match.date,
    kickoff: match.kickoff,
    venue: match.venue,
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
  }
}

function safeLeagueUpdate(update) {
  return {
    id: update._id.toString(),
    title: update.title,
    body: update.body,
    createdAt: update.createdAt,
  }
}

function safeRegistration(registration) {
  return {
    id: registration._id.toString(),
    teamName: registration.teamName,
    division: registration.division,
    managerName: registration.managerName,
    email: registration.email,
    phone: registration.phone,
    homeGround: registration.homeGround,
    status: registration.status,
    submittedAt: registration.createdAt,
    reviewedAt: registration.reviewedAt,
  }
}

function signInToken(account, role) {
  const user = safeUser(account, role)
  return { token: jwt.sign(user, jwtSecret, { expiresIn: '12h' }), user }
}

function databaseReady(request, response, next) {
  if (mongoose.connection.readyState !== 1) {
    return response.status(503).json({ error: 'The configured MongoDB database is unreachable. Check the connection URI, cluster status, and network access rules.' })
  }
  next()
}

async function ensureTeamCapacity() {
  let capacity = await LeagueCapacity.findById('active-teams')
  if (capacity) return capacity

  const activeTeams = await TeamRegistration.countDocuments({ status: { $in: ['pending', 'approved'] } })
  try {
    capacity = await LeagueCapacity.create({ _id: 'active-teams', activeTeams })
  } catch (error) {
    if (error.code !== 11000) throw error
    capacity = await LeagueCapacity.findById('active-teams')
  }
  return capacity
}

async function reserveTeamCapacity() {
  await ensureTeamCapacity()
  return LeagueCapacity.findOneAndUpdate(
    { _id: 'active-teams', activeTeams: { $lt: maxActiveTeams } },
    { $inc: { activeTeams: 1 } },
    { returnDocument: 'after' },
  )
}

async function authenticate(request, response, next) {
  const authorization = request.get('authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) return response.status(401).json({ error: 'Sign in to continue.' })

  try {
    const claims = jwt.verify(token, jwtSecret)
    const account = await Account.findById(claims.id).select('_id role').lean()
    if (!account) return response.status(401).json({ error: 'Account not found.' })
    if (claims.role === 'admin' && account.role !== 'admin') {
      return response.status(403).json({ error: 'Administrator access is required.' })
    }
    request.account = account
    request.authRole = claims.role === 'admin' ? 'admin' : 'user'
    return next()
  } catch {
    return response.status(401).json({ error: 'Your session has expired. Please sign in again.' })
  }
}

function administratorOnly(request, response, next) {
  if (request.authRole !== 'admin') return response.status(403).json({ error: 'Administrator access is required.' })
  next()
}

async function sendEmail({ to, subject, text }) {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL
  const senderName = process.env.BREVO_SENDER_NAME || 'Local Football League'
  if (!apiKey || !senderEmail) {
    throw new Error('Email delivery is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.')
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || result.code || `Brevo API request failed with status ${response.status}.`)
}

async function seedDefaultAdmin() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD || ''
  if (!email || !password) {
    console.warn('Default admin not seeded; set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env.')
    return
  }

  const existing = await Account.findOne({ email })
  if (existing) return
  await Account.create({
    name: 'League Administrator',
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'admin',
    adminIdHash: hashSecret(process.env.ADMIN_SPECIAL_ID || 'LEAGUE-ADMIN-2026'),
  })
  console.log('Default administrator account is ready.')
}

app.post('/api/auth/register', databaseReady, async (request, response) => {
  const name = String(request.body?.name || '').trim()
  const email = String(request.body?.email || '').trim().toLowerCase()
  const password = String(request.body?.password || '')

  if (name.length < 2 || name.length > 80) return response.status(400).json({ error: 'Enter a name between 2 and 80 characters.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return response.status(400).json({ error: 'Enter a valid email address.' })
  if (password.length < 8 || password.length > 128) return response.status(400).json({ error: 'Password must be between 8 and 128 characters.' })
  if (await Account.exists({ email })) return response.status(409).json({ error: 'An account with that email already exists.' })

  const account = await Account.create({ name, email, passwordHash: await bcrypt.hash(password, 12) })
  return response.status(201).json({ user: safeUser(account), message: 'Account created. You can now sign in.' })
})

app.post('/api/auth/login', databaseReady, async (request, response) => {
  const email = String(request.body?.email || '').trim().toLowerCase()
  const password = String(request.body?.password || '')
  const role = request.body?.role === 'admin' ? 'admin' : 'user'
  const account = await Account.findOne({ email })
    .select('name email passwordHash role +adminIdHash')
    .lean()

  if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
    return response.status(401).json({ error: 'Email or password is incorrect.' })
  }
  if (role === 'admin' && account.role !== 'admin') {
    return response.status(403).json({ error: 'This account does not have administrator access.' })
  }
  if (role === 'admin' && !matchesHash(request.body?.adminId, account.adminIdHash)) {
    return response.status(403).json({ error: 'Administrator ID is incorrect.' })
  }

  return response.json(signInToken(account, role))
})

app.post('/api/auth/password-reset/request', databaseReady, async (request, response) => {
  const email = String(request.body?.email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
    return response.status(400).json({ error: 'Enter a valid email address.' })
  }

  const genericMessage = 'If an account exists for this email, a six-digit reset code has been sent.'
  const account = await Account.findOne({ email })
  if (!account) return response.status(202).json({ message: genericMessage })

  const now = new Date()
  const previous = await PasswordReset.findOne({ email })
  if (previous && now.getTime() - previous.lastSentAt.getTime() < 60_000) {
    return response.status(202).json({ message: genericMessage })
  }

  const code = String(crypto.randomInt(100000, 1000000))
  await PasswordReset.findOneAndUpdate({ email }, {
    email,
    codeHash: hashSecret(code),
    attempts: 0,
    lastSentAt: now,
    expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
  }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true })

  try {
    await sendEmail({
      to: email,
      subject: 'Your Local Football League password reset code',
      text: [
        `Your six-digit password reset code is: ${code}`,
        '',
        'This code expires in 15 minutes and can only be used once.',
        'If you did not request a password reset, you can ignore this email.',
      ].join('\n'),
    })
  } catch (error) {
    await PasswordReset.deleteOne({ email })
    console.error('Password reset email failed:', error.message)
    return response.status(503).json({ error: 'Could not send the reset email. Check Brevo API and verified sender settings in the backend environment.' })
  }

  return response.status(202).json({ message: genericMessage })
})

app.post('/api/auth/password-reset/complete', databaseReady, async (request, response) => {
  const email = String(request.body?.email || '').trim().toLowerCase()
  const code = String(request.body?.code || '').trim()
  const password = String(request.body?.password || '')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
    return response.status(400).json({ error: 'Enter a valid email address.' })
  }
  if (!/^\d{6}$/.test(code)) return response.status(400).json({ error: 'Enter the six-digit code from your email.' })
  if (password.length < 8 || password.length > 128) {
    return response.status(400).json({ error: 'Password must be between 8 and 128 characters.' })
  }

  const reset = await PasswordReset.findOne({ email, expiresAt: { $gt: new Date() } }).select('+codeHash')
  if (!reset) return response.status(400).json({ error: 'The reset code is invalid or expired. Request a new code.' })
  if (reset.attempts >= 5) return response.status(429).json({ error: 'Too many incorrect codes. Request a new reset code.' })
  if (!matchesHash(code, reset.codeHash)) {
    reset.attempts += 1
    await reset.save()
    return response.status(400).json({ error: 'The reset code is invalid or expired.' })
  }

  const account = await Account.findOne({ email })
  if (!account) {
    await PasswordReset.deleteOne({ _id: reset._id })
    return response.status(400).json({ error: 'The reset code is invalid or expired.' })
  }
  account.passwordHash = await bcrypt.hash(password, 12)
  await account.save()
  await PasswordReset.deleteOne({ _id: reset._id })
  return response.json({ message: 'Password reset successfully. You can sign in with the new password.' })
})

app.get('/api/auth/me', databaseReady, authenticate, (request, response) => {
  response.json({ user: safeUser(request.account, request.authRole) })
})

app.post('/api/registrations', databaseReady, async (request, response) => {
  const registration = {
    teamName: String(request.body?.teamName || '').trim(),
    division: String(request.body?.division || '').trim(),
    managerName: String(request.body?.managerName || '').trim(),
    email: String(request.body?.email || '').trim().toLowerCase(),
    phone: String(request.body?.phone || '').trim(),
    homeGround: String(request.body?.homeGround || '').trim(),
  }
  if (!registration.teamName || registration.teamName.length > 80) return response.status(400).json({ error: 'Enter a team name up to 80 characters.' })
  if (!registration.division || registration.division.length > 60) return response.status(400).json({ error: 'Enter a division up to 60 characters.' })
  if (!registration.managerName || registration.managerName.length > 80) return response.status(400).json({ error: 'Enter a manager name up to 80 characters.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registration.email) || registration.email.length > 160) return response.status(400).json({ error: 'Enter a valid contact email.' })
  if (registration.phone.length > 40 || registration.homeGround.length > 100) return response.status(400).json({ error: 'Phone or home ground information is too long.' })

  const capacity = await reserveTeamCapacity()
  if (!capacity) {
    return response.status(409).json({ error: 'The league has reached its 70-team capacity. Please contact the league administrator.' })
  }

  let saved
  try {
    saved = await TeamRegistration.create(registration)
  } catch (error) {
    await LeagueCapacity.updateOne({ _id: 'active-teams' }, { $inc: { activeTeams: -1 } })
    throw error
  }
  return response.status(201).json({ registration: safeRegistration(saved) })
})

app.get('/api/teams', databaseReady, async (request, response) => {
  const registrations = await TeamRegistration.find({ status: 'approved' })
    .sort({ teamName: 1 })
    .select('teamName division homeGround')
    .lean()
  response.json({ teams: registrations.map((registration) => ({
    id: registration._id.toString(),
    teamName: registration.teamName,
    division: registration.division,
    homeGround: registration.homeGround,
  })) })
})

app.get('/api/admin/registrations', databaseReady, authenticate, administratorOnly, async (request, response) => {
  const registrations = await TeamRegistration.find({ status: 'pending' }).sort({ createdAt: -1 }).lean()
  response.json({ registrations: registrations.map(safeRegistration) })
})

app.put('/api/admin/registrations/:id', databaseReady, authenticate, administratorOnly, async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid registration ID.' })
  const updates = {
    teamName: String(request.body?.teamName || '').trim(),
    division: String(request.body?.division || '').trim(),
    managerName: String(request.body?.managerName || '').trim(),
    email: String(request.body?.email || '').trim().toLowerCase(),
    phone: String(request.body?.phone || '').trim(),
    homeGround: String(request.body?.homeGround || '').trim(),
  }
  if (!updates.teamName || updates.teamName.length > 80 || !updates.division || updates.division.length > 60) return response.status(400).json({ error: 'Enter a valid team name and division.' })
  if (!updates.managerName || updates.managerName.length > 80) return response.status(400).json({ error: 'Enter a valid manager name.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email) || updates.email.length > 160) return response.status(400).json({ error: 'Enter a valid contact email.' })
  if (updates.phone.length > 40 || updates.homeGround.length > 100) return response.status(400).json({ error: 'Phone or home ground information is too long.' })

  const registration = await TeamRegistration.findByIdAndUpdate(request.params.id, updates, { returnDocument: 'after', runValidators: true })
  if (!registration) return response.status(404).json({ error: 'Registration not found.' })
  return response.json({ registration: safeRegistration(registration) })
})

app.patch('/api/admin/registrations/:id/status', databaseReady, authenticate, administratorOnly, async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid registration ID.' })
  const status = request.body?.status
  if (!['approved', 'rejected'].includes(status)) return response.status(400).json({ error: 'Status must be approved or rejected.' })
  await ensureTeamCapacity()
  const registration = await TeamRegistration.findOneAndUpdate({
    _id: request.params.id,
    status: { $in: ['pending', 'approved'] },
  }, {
    status,
    reviewedAt: new Date(),
    reviewedBy: request.account._id,
  }, { returnDocument: 'after', runValidators: true })
  if (!registration) {
    const existing = await TeamRegistration.findById(request.params.id).lean()
    if (!existing) return response.status(404).json({ error: 'Registration not found.' })
    if (existing.status === status) return response.json({ registration: safeRegistration(existing) })
    return response.status(409).json({ error: 'Rejected registrations cannot be reactivated. Submit a new application.' })
  }
  if (status === 'rejected') {
    await LeagueCapacity.updateOne({ _id: 'active-teams' }, { $inc: { activeTeams: -1 } })
  }
  return response.json({ registration: safeRegistration(registration) })
})

app.get('/api/matches', databaseReady, async (request, response) => {
  const matches = await Match.find({}).sort({ date: 1, kickoff: 1 }).lean()
  response.json({ matches: matches.map(safeMatch) })
})

app.get('/api/updates', databaseReady, async (request, response) => {
  const updates = await LeagueUpdate.find({}).sort({ createdAt: -1 }).lean()
  response.json({ updates: updates.map(safeLeagueUpdate) })
})

app.post('/api/admin/updates', databaseReady, authenticate, administratorOnly, async (request, response) => {
  const title = String(request.body?.title || '').trim()
  const body = String(request.body?.body || '').trim()
  if (!title || title.length > 120) return response.status(400).json({ error: 'Enter a headline up to 120 characters.' })
  if (!body || body.length > 1200) return response.status(400).json({ error: 'Enter an update up to 1200 characters.' })

  const update = await LeagueUpdate.create({ title, body, createdBy: request.account._id })
  return response.status(201).json({ update: safeLeagueUpdate(update) })
})

app.delete('/api/admin/updates/:id', databaseReady, authenticate, administratorOnly, async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid update ID.' })
  const update = await LeagueUpdate.findByIdAndDelete(request.params.id)
  if (!update) return response.status(404).json({ error: 'Update not found.' })
  return response.json({ deleted: update._id.toString() })
})

app.post('/api/admin/matches', databaseReady, authenticate, administratorOnly, async (request, response) => {
  const homeTeam = String(request.body?.homeTeam || '').trim()
  const awayTeam = String(request.body?.awayTeam || '').trim()
  const date = String(request.body?.date || '')
  const kickoff = String(request.body?.kickoff || '')
  const venue = String(request.body?.venue || '').trim()
  const status = request.body?.status === 'completed' ? 'completed' : 'scheduled'

  if (!homeTeam || homeTeam.length > 80 || !awayTeam || awayTeam.length > 80) {
    return response.status(400).json({ error: 'Enter valid home and away team names (up to 80 characters).' })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    return response.status(400).json({ error: 'Enter a valid match date.' })
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(kickoff)) {
    return response.status(400).json({ error: 'Enter a valid kick-off time.' })
  }
  if (venue.length > 120) return response.status(400).json({ error: 'Venue must be 120 characters or fewer.' })

  const homeScore = status === 'completed' ? Number(request.body?.homeScore) : null
  const awayScore = status === 'completed' ? Number(request.body?.awayScore) : null
  if (status === 'completed' && (!Number.isInteger(homeScore) || homeScore < 0 || homeScore > 99 || !Number.isInteger(awayScore) || awayScore < 0 || awayScore > 99)) {
    return response.status(400).json({ error: 'Enter valid scores between 0 and 99.' })
  }

  const match = await Match.create({ homeTeam, awayTeam, date, kickoff, venue, status, homeScore, awayScore, createdBy: request.account._id })
  return response.status(201).json({ match: safeMatch(match) })
})

app.put('/api/admin/matches/:id', databaseReady, authenticate, administratorOnly, async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid match ID.' })
  const homeTeam = String(request.body?.homeTeam || '').trim()
  const awayTeam = String(request.body?.awayTeam || '').trim()
  const date = String(request.body?.date || '')
  const kickoff = String(request.body?.kickoff || '')
  const venue = String(request.body?.venue || '').trim()
  const status = request.body?.status === 'completed' ? 'completed' : 'scheduled'
  if (!homeTeam || homeTeam.length > 80 || !awayTeam || awayTeam.length > 80) return response.status(400).json({ error: 'Enter valid home and away team names (up to 80 characters).' })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return response.status(400).json({ error: 'Enter a valid match date.' })
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(kickoff)) return response.status(400).json({ error: 'Enter a valid kick-off time.' })
  if (venue.length > 120) return response.status(400).json({ error: 'Venue must be 120 characters or fewer.' })
  const homeScore = status === 'completed' ? Number(request.body?.homeScore) : null
  const awayScore = status === 'completed' ? Number(request.body?.awayScore) : null
  if (status === 'completed' && (!Number.isInteger(homeScore) || homeScore < 0 || homeScore > 99 || !Number.isInteger(awayScore) || awayScore < 0 || awayScore > 99)) return response.status(400).json({ error: 'Enter valid scores between 0 and 99.' })

  const match = await Match.findByIdAndUpdate(request.params.id, { homeTeam, awayTeam, date, kickoff, venue, status, homeScore, awayScore }, { returnDocument: 'after', runValidators: true })
  if (!match) return response.status(404).json({ error: 'Match not found.' })
  return response.json({ match: safeMatch(match) })
})

app.delete('/api/admin/matches/:id', databaseReady, authenticate, administratorOnly, async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid match ID.' })
  const match = await Match.findByIdAndDelete(request.params.id)
  if (!match) return response.status(404).json({ error: 'Match not found.' })
  return response.json({ deleted: match._id.toString() })
})

app.post('/api/admin/invitations', databaseReady, authenticate, administratorOnly, async (request, response) => {
  const name = String(request.body?.name || '').trim()
  const email = String(request.body?.email || '').trim().toLowerCase()
  if (name.length < 2 || name.length > 80) return response.status(400).json({ error: 'Enter a name between 2 and 80 characters.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return response.status(400).json({ error: 'Enter a valid email address.' })
  if (await Account.exists({ email })) return response.status(409).json({ error: 'That email already has an account.' })

  const verificationCode = String(crypto.randomInt(100000000, 1000000000))
  const adminId = `ADMIN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`
  const invitation = await AdminInvitation.create({
    name,
    email,
    verificationCodeHash: hashSecret(verificationCode),
    adminIdHash: hashSecret(adminId),
    adminIdEncrypted: encryptSecret(adminId),
    invitedBy: request.account._id,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  })

  try {
    const appUrl = process.env.APP_URL || 'https://big-boys-fc.vercel.app'
    const activationUrl = `${appUrl}/accept-admin-invite?email=${encodeURIComponent(email)}`
    await sendEmail({
      to: email,
      subject: 'Your Local Football League administrator invitation',
      text: [
        `Hello ${name},`,
        '',
        'An administrator has invited you to manage the Local Football League.',
        `Your one-time verification code is: ${verificationCode}`,
        `Your administrator sign-in ID is: ${adminId}`,
        '',
        `Accept the invitation within 24 hours: ${activationUrl}`,
        'Create your own password during activation. Never share your verification code or administrator ID.',
      ].join('\n'),
    })
  } catch (error) {
    await AdminInvitation.deleteOne({ _id: invitation._id })
    if (error.message.startsWith('Email delivery is not configured')) {
      return response.status(503).json({ error: error.message })
    }
    console.error('Admin invitation email failed:', error.message)
    return response.status(502).json({ error: 'The invitation email could not be sent. Check the SMTP settings and try again.' })
  }

  return response.status(201).json({
    invitation: { id: invitation._id.toString(), name, email, expiresAt: invitation.expiresAt },
    message: 'Invitation and administrator ID sent by email.',
  })
})

app.get('/api/admin/invitations', databaseReady, authenticate, administratorOnly, async (request, response) => {
  const invitations = await AdminInvitation.find({ acceptedAt: null, expiresAt: { $gt: new Date() } })
    .sort({ createdAt: -1 })
    .select('name email createdAt expiresAt')
    .lean()
  response.json({ invitations })
})

app.get('/api/admin/accounts', databaseReady, authenticate, administratorOnly, async (request, response) => {
  const accounts = await Account.find({ role: 'admin' })
    .sort({ createdAt: 1 })
    .select('name email createdAt')
    .lean()
  response.json({ administrators: accounts.map((account) => ({
    id: account._id.toString(),
    name: account.name,
    email: account.email,
    createdAt: account.createdAt,
  })) })
})

app.post('/api/auth/accept-admin-invitation', databaseReady, async (request, response) => {
  const name = String(request.body?.name || '').trim()
  const email = String(request.body?.email || '').trim().toLowerCase()
  const code = String(request.body?.verificationCode || '').trim()
  const password = String(request.body?.password || '')
  if (name.length < 2 || name.length > 80) return response.status(400).json({ error: 'Enter a name between 2 and 80 characters.' })
  if (password.length < 8 || password.length > 128) return response.status(400).json({ error: 'Password must be between 8 and 128 characters.' })

  const invitation = await AdminInvitation.findOne({ email, acceptedAt: null, expiresAt: { $gt: new Date() } })
    .select('+verificationCodeHash +adminIdHash +adminIdEncrypted')
  if (!invitation) {
    return response.status(400).json({ error: 'The invitation code is invalid or expired.' })
  }
  if (invitation.verificationAttempts >= 5) {
    return response.status(400).json({ error: 'Too many incorrect codes. Ask an administrator to send a new invitation.' })
  }
  if (!matchesHash(code, invitation.verificationCodeHash)) {
    invitation.verificationAttempts += 1
    await invitation.save()
    return response.status(400).json({ error: 'The invitation code is invalid or expired.' })
  }
  if (await Account.exists({ email })) return response.status(409).json({ error: 'That email already has an account.' })

  const account = await Account.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'admin',
    adminIdHash: invitation.adminIdHash,
  })
  invitation.name = name
  invitation.acceptedAt = new Date()
  await invitation.save()

  let activationEmailSent = false
  try {
    await sendEmail({
      to: email,
      subject: 'Your Local Football League administrator account is active',
      text: [
        `Hello ${name},`,
        '',
        'Your administrator account is active.',
        `Sign-in email: ${email}`,
        `Administrator ID: ${decryptSecret(invitation.adminIdEncrypted)}`,
        'Use the password you chose during activation. For security, your password is never sent by email.',
      ].join('\n'),
    })
    activationEmailSent = true
  } catch (error) {
    console.error('Admin activation email failed:', error.message)
  }

  const message = activationEmailSent
    ? 'Administrator account activated. Your sign-in details have been emailed.'
    : 'Administrator account activated, but the sign-in email failed. Contact the league administrator.'
  return response.status(201).json({ user: safeUser(account), message })
})

app.get('/api/health', (request, response) => {
  response.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
})

app.use((error, request, response, next) => {
  console.error(error)
  if (error.code === 11000) return response.status(409).json({ error: 'That account or invitation already exists.' })
  response.status(500).json({ error: 'The server could not complete the request.' })
})

mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
  .then(seedDefaultAdmin)
  .then(() => console.log('MongoDB connected.'))
  .catch((error) => console.error(`MongoDB unavailable: ${error.message}`))

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening on 0.0.0.0:${port}`)
})
