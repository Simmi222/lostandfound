const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api'
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const access = localStorage.getItem('access')
  if (access) headers.set('Authorization', `Bearer ${access}`)
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  try {
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      const message =
        body.message ||
        body.detail ||
        body.error ||
        (typeof body === 'object' && body !== null
          ? Object.entries(body)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
              .join(' | ')
          : null) ||
        'Request failed.'
      throw new Error(`${response.status}: ${message}`)
    }
    return body as T
  } catch (err: unknown) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('Unable to connect to backend server. Please make sure the Django server is running on http://127.0.0.1:8000.')
    }
    throw err
  }
}

export type ApiReport = {
  id: number
  kind: 'MISSING' | 'FOUND'
  status: string
  name: string
  age: number | null
  height: string
  gender: string
  colour: string
  last_seen_place: string
  lost_or_found_date: string | null
  description: string
  circumstances: string
  created_by_username: string
  created_at: string
  photos: { id: number; photo: string; processing_status: string }[]
}

export type Person = ApiReport & {
  photo: string
  city: string
  lastSeenPlace: string
  lastSeenDate: string
  wearing: string
  from: string
  letter: string
  traits: string[]
  sightings: number
}

export type Match = {
  report_id: number
  photo_id: number
  name: string
  age: number | null
  description: string
  last_seen_place: string
  created_by_username: string
  photo_url: string | null
  face_distance: number
}

export type CaseReport = {
  photos: File[]
  name: string
  age: string
  height: string
  city: string
  lastSeenPlace: string
  lastSeenDate: string
  wearing: string
  traits: string
  letter: string
  contactName: string
  contactPhone: string
}

export type SeenReport = {
  reporterName: string
  reporterPhone: string
  personName: string
  gender: string
  ageRange: string
  complexion: string
  clothesColour: string
  disabilities: string[]
  disabilityNote: string
  marks: string
  place: string
  city: string
  seenAt: string
  notes: string
}

type Paginated<T> = { results: T[] }

export const absolutePhoto = (url: string | null | undefined) => {
  if (!url) return ''
  return url.startsWith('http') ? url : `${API_ORIGIN}${url}`
}

export const toPerson = (report: ApiReport): Person => ({
  ...report,
  photo: absolutePhoto(report.photos[0]?.photo),
  city: report.last_seen_place,
  lastSeenPlace: report.last_seen_place,
  lastSeenDate: report.lost_or_found_date ?? report.created_at,
  wearing: report.colour,
  from: report.created_by_username,
  letter: report.description,
  traits: [report.gender, report.height].filter(Boolean),
  sightings: 0,
})

export async function login(username: string, password: string) {
  const result = await request<{ user: Record<string, unknown>; tokens: { access: string; refresh: string } }>(
    '/auth/login/',
    { method: 'POST', body: JSON.stringify({ username, password }) },
  )
  localStorage.setItem('access', result.tokens.access)
  localStorage.setItem('refresh', result.tokens.refresh)
  localStorage.setItem('user', JSON.stringify(result.user))
  return result
}

export async function register(data: Record<string, unknown>) {
  const result = await request<{ user: Record<string, unknown>; tokens: { access: string; refresh: string } }>(
    '/auth/register/',
    { method: 'POST', body: JSON.stringify(data) },
  )
  localStorage.setItem('access', result.tokens.access)
  localStorage.setItem('refresh', result.tokens.refresh)
  localStorage.setItem('user', JSON.stringify(result.user))
  return result
}

export function logout() {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
  localStorage.removeItem('user')
}

export const isLoggedIn = () => Boolean(localStorage.getItem('access'))

export async function listMissing(): Promise<Person[]> {
  const data = await request<ApiReport[] | Paginated<ApiReport>>('/reports/missing/')
  const reports: ApiReport[] = Array.isArray(data) ? data : data.results
  return reports.map(toPerson)
}

export async function getPerson(id: string): Promise<Person | undefined> {
  try {
    return toPerson(await request<ApiReport>(`/reports/missing/${id}/`))
  } catch {
    return undefined
  }
}

export async function submitReport(report: CaseReport, onProgress?: (pct: number) => void) {
  const form = new FormData()
  form.append('name', report.name)
  form.append('age', report.age)
  form.append('height', report.height)
  form.append('last_seen_place', `${report.city}, ${report.lastSeenPlace}`)
  form.append('colour', report.wearing)
  form.append('description', `${report.letter}\n${report.traits}`)
  form.append('contact_name', report.contactName)
  form.append('contact_phone', report.contactPhone)
  if (report.lastSeenDate) form.append('lost_or_found_date', report.lastSeenDate)
  report.photos.forEach((photo) => form.append('images', photo))
  onProgress?.(20)
  const created = await request<ApiReport>('/reports/missing/', { method: 'POST', body: form })
  onProgress?.(100)
  return { caseId: `REPORT-${created.id}` }
}

export async function searchByPhoto(photo: File): Promise<Match[]> {
  const form = new FormData()
  form.append('photo', photo)
  const data = await request<{ matches: Match[] }>('/matches/search/', { method: 'POST', body: form })
  return data.matches
}

export async function searchByName(query: string): Promise<Person[]> {
  const data = await request<{ matches: Array<Record<string, unknown>> }>(
    `/matches/search-by-name/?q=${encodeURIComponent(query)}`,
  )
  return data.matches.map((item): ApiReport => ({
    id: Number(item.report_id),
    kind: 'MISSING',
    status: 'SUBMITTED',
    name: String(item.name ?? ''),
    age: (item.age as number | null) ?? null,
    height: '',
    gender: '',
    colour: '',
    last_seen_place: String(item.last_seen_place ?? ''),
    lost_or_found_date: (item.lost_or_found_date as string | null) ?? null,
    description: String(item.description ?? ''),
    circumstances: '',
    created_by_username: String(item.created_by_username ?? ''),
    created_at: '',
    photos: item.photo_url ? [{ id: 0, photo: String(item.photo_url), processing_status: 'PROCESSED' }] : [],
  })).map(toPerson)
}

export async function getDashboard() {
  return request<{ reports: ApiReport[]; matches: unknown[]; unread_notifications: number }>('/matches/dashboard/')
}

export type SimilarMatchItem = {
  id: number
  report_low: number
  report_high: number
  report_summary: {
    id: number
    name: string
    age: number | null
    last_seen_place: string
    description: string
    photo_url: string | null
  }
  matched_report_summary: {
    id: number
    name: string
    age: number | null
    last_seen_place: string
    description: string
    photo_url: string | null
  }
  face_distance: number
  review_status: string
  created_at: string
}

export type DirectMatchItem = {
  id: number
  missing_report: number
  found_report: number
  missing_report_summary: {
    id: number
    name: string
    age: number | null
    last_seen_place: string
    description: string
  } | null
  found_report_summary: {
    id: number
    name: string
    age: number | null
    last_seen_place: string
    description: string
  } | null
  face_distance: number
  review_status: string
  created_at: string
}

export async function fetchAllMatches() {
  const [similar, mine] = await Promise.all([
    request<SimilarMatchItem[] | Paginated<SimilarMatchItem>>('/matches/similar/').catch(() => []),
    request<DirectMatchItem[] | Paginated<DirectMatchItem>>('/matches/mine/').catch(() => []),
  ])
  const similarList: SimilarMatchItem[] = Array.isArray(similar) ? similar : (similar as Paginated<SimilarMatchItem>).results || []
  const mineList: DirectMatchItem[] = Array.isArray(mine) ? mine : (mine as Paginated<DirectMatchItem>).results || []
  return { similar: similarList, direct: mineList }
}

export async function getSimilarMatches() {
  const data = await request<unknown[] | Paginated<unknown>>('/matches/similar/')
  return Array.isArray(data) ? data : data.results
}

export async function reportSeenPerson(report: SeenReport, photo: File | null) {
  const form = new FormData()
  form.append('name', report.personName || 'Unknown')
  form.append('gender', report.gender)
  form.append('age', report.ageRange.replace(/\D/g, '').split('-')[0] || '')
  form.append('last_seen_place', `${report.city}, ${report.place}`)
  form.append('lost_or_found_date', report.seenAt.slice(0, 10))
  form.append('colour', report.complexion)
  form.append('description', `${report.notes}\n${report.clothesColour}\n${report.marks}`)
  form.append('contact_name', report.reporterName)
  form.append('contact_phone', report.reporterPhone)
  if (photo) form.append('images', photo)
  const created = await request<ApiReport>('/reports/found/', { method: 'POST', body: form })
  return { sightingId: `SIGHTING-${created.id}` }
}

export async function reportSighting(personId: string, note: string) {
  const form = new FormData()
  form.append('name', `Sighting for report ${personId}`)
  form.append('description', note)
  form.append('last_seen_place', 'Reported by user')
  await request('/reports/found/', { method: 'POST', body: form })
}

export async function requestVerification(_personId: string) {}
