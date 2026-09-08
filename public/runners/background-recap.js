/**
 * Rafraichissement du recap hebdomadaire en arriere-plan — @capacitor/background-runner.
 *
 * CE FICHIER NE TOURNE PAS DANS LE WEBVIEW. Il est evalue par un moteur JS
 * autonome (QuickJS sur Android) reveille par l'OS (WorkManager) meme quand
 * l'app est fermee. Consequences directes sur la facon de l'ecrire :
 *
 *  - Aucun import/export : le fichier est charge tel quel, il doit etre autonome.
 *    D'ou la petite duplication avec src/lib/notifications/eventReminders.ts.
 *  - Pas de DOM, pas de plugins Capacitor habituels. Seuls existent `fetch`,
 *    `console`, `setTimeout` et les API listees ci-dessous (`CapacitorKV`,
 *    `CapacitorNotifications`).
 *  - `resolve()` (ou `reject()`) DOIT etre appele dans chaque gestionnaire,
 *    sinon l'OS tue le processus au bout de quelques secondes.
 *  - Chaque execution repart d'un contexte neuf : le seul etat qui survit est
 *    celui ecrit dans `CapacitorKV` (SharedPreferences nommees d'apres le
 *    `label` du runner — voir capacitor.config.ts).
 *
 * Le pendant cote app est src/lib/notifications/backgroundRecap.ts, qui pousse
 * ici les identifiants via l'evenement `configure`.
 *
 * Ecrit en promesses `.then()` plutot qu'en async/await, et en ES5 sans
 * littéraux de gabarit : c'est le style des exemples officiels du plugin,
 * donc celui dont la compatibilite est garantie.
 */

/* global addEventListener, CapacitorKV, CapacitorNotifications, fetch */

// --- Clés persistées ---------------------------------------------------------

var KEY_ENABLED = 'enabled'
var KEY_SUPABASE_URL = 'supabaseUrl'
var KEY_ANON_KEY = 'anonKey'
var KEY_HOUSEHOLD_ID = 'householdId'
var KEY_ACCESS_TOKEN = 'accessToken'
var KEY_REFRESH_TOKEN = 'refreshToken'

// --- Réglages ------------------------------------------------------------

// Doit rester identique au canal cree cote app (src/lib/notifications/eventReminders.ts) :
// Android n'affiche rien si le canal n'existe pas encore.
var CHANNEL_EVENTS = 'myoldsharedcalendar-events'
// Doit rester identique a RECAP_ID dans eventReminders.ts : c'est ce qui permet
// de remplacer la notification deja planifiee par l'app plutot que d'en ajouter une.
var RECAP_ID = 42424242
var RECAP_WEEKDAY = 0 // dimanche
var RECAP_HOUR = 18
// Ne rafraichit que si le recap est proche : evite un appel reseau a chaque
// reveil horaire pour rien.
var REFRESH_WINDOW_HOURS = 24

var RECAP_INTROS = [
  'Accroche-toi',
  'Spoiler alert',
  'Roulement de tambour',
  'Attention les yeux',
  'Prepare le cafe'
]

// --- Petites aides -----------------------------------------------------------

function kvGet(key) {
  try {
    var res = CapacitorKV.get(key)
    if (!res || res.value === null || res.value === undefined) return ''
    return String(res.value)
  } catch (err) {
    return ''
  }
}

function kvSet(key, value) {
  try {
    CapacitorKV.set(key, value === null || value === undefined ? '' : String(value))
  } catch (err) {
    console.error('[bg-recap] écriture ' + key + ' impossible', err)
  }
}

function truthy(value) {
  return value === true || value === 'true' || value === '1' || value === 1
}

function nextOccurrence(weekday, hour, from) {
  var result = new Date(from.getTime())
  result.setHours(hour, 0, 0, 0)
  var diff = (weekday - result.getDay() + 7) % 7
  if (diff === 0 && result.getTime() <= from.getTime()) diff = 7
  result.setDate(result.getDate() + diff)
  return result
}

function pickRecapIntro() {
  var weekOfYear = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  return RECAP_INTROS[weekOfYear % RECAP_INTROS.length]
}

// --- Supabase (extrait autonome) ---------------------------------------------

function fetchWeekEvents(state, accessToken) {
  var now = new Date()
  var recapAt = nextOccurrence(RECAP_WEEKDAY, RECAP_HOUR, now)
  var weekEnd = new Date(recapAt.getTime() + 7 * 24 * 60 * 60 * 1000)

  var url =
    state.supabaseUrl +
    '/rest/v1/events?household_id=eq.' +
    encodeURIComponent(state.householdId) +
    '&all_day=eq.false&starts_at=gte.' +
    encodeURIComponent(now.toISOString()) +
    '&starts_at=lte.' +
    encodeURIComponent(weekEnd.toISOString()) +
    '&select=title,starts_at&order=starts_at.asc'

  return fetch(url, {
    method: 'GET',
    headers: { apikey: state.anonKey, authorization: 'Bearer ' + accessToken }
  }).then(function (res) {
    if (res.status === 401) {
      var unauthorized = new Error('unauthorized')
      unauthorized.code = 401
      throw unauthorized
    }
    if (!res.ok) throw new Error('Supabase a répondu ' + res.status)
    return res.json()
  })
}

function refreshAccessToken(state) {
  var url = state.supabaseUrl + '/auth/v1/token?grant_type=refresh_token'
  return fetch(url, {
    method: 'POST',
    headers: { apikey: state.anonKey, 'content-type': 'application/json' },
    body: JSON.stringify({ refresh_token: state.refreshToken })
  })
    .then(function (res) {
      if (!res.ok) throw new Error('Rafraîchissement du jeton échoué (' + res.status + ')')
      return res.json()
    })
    .then(function (json) {
      kvSet(KEY_ACCESS_TOKEN, json.access_token)
      kvSet(KEY_REFRESH_TOKEN, json.refresh_token)
      return json.access_token
    })
}

function fetchWeekEventsWithRetry(state) {
  return fetchWeekEvents(state, state.accessToken).catch(function (err) {
    if (err && err.code === 401 && state.refreshToken) {
      return refreshAccessToken(state).then(function (freshToken) {
        return fetchWeekEvents(state, freshToken)
      })
    }
    throw err
  })
}

// --- Notification --------------------------------------------------------

function scheduleRecapNotification(events) {
  if (!events || events.length === 0) return
  var plural = events.length > 1 ? 's' : ''
  var titles = []
  for (var i = 0; i < events.length && i < 3; i++) titles.push(events[i].title)
  var body = titles.join(' · ')
  if (events.length > 3) body += ' +' + (events.length - 3) + ' autre(s)'

  try {
    CapacitorNotifications.schedule([
      {
        id: RECAP_ID,
        channelId: CHANNEL_EVENTS,
        title: pickRecapIntro() + ' : ' + events.length + ' événement' + plural + ' cette semaine',
        body: body,
        autoCancel: true,
        ongoing: false
      }
    ])
  } catch (err) {
    console.error('[bg-recap] notification impossible', err)
  }
}

// --- État --------------------------------------------------------------------

function readState() {
  return {
    enabled: kvGet(KEY_ENABLED) === '1',
    supabaseUrl: kvGet(KEY_SUPABASE_URL),
    anonKey: kvGet(KEY_ANON_KEY),
    householdId: kvGet(KEY_HOUSEHOLD_ID),
    accessToken: kvGet(KEY_ACCESS_TOKEN),
    refreshToken: kvGet(KEY_REFRESH_TOKEN)
  }
}

function isConfigured(state) {
  return !!(state.supabaseUrl && state.anonKey && state.householdId && state.accessToken)
}

// --- Événements ----------------------------------------------------------

/**
 * Réveil périodique déclenché par l'OS (nom déclaré dans capacitor.config.ts).
 * Ne rejette jamais : un `reject()` marque la tâche WorkManager en échec sans
 * rien apporter, l'erreur étant presque toujours transitoire (réseau coupé,
 * jeton expiré sans refresh_token valide...).
 */
addEventListener('refreshRecap', function (resolve, reject, args) {
  var state = readState()

  if (!state.enabled || !isConfigured(state)) {
    resolve({ skipped: true })
    return
  }

  var now = new Date()
  var recapAt = nextOccurrence(RECAP_WEEKDAY, RECAP_HOUR, now)
  var hoursUntilRecap = (recapAt.getTime() - now.getTime()) / (60 * 60 * 1000)
  if (hoursUntilRecap > REFRESH_WINDOW_HOURS) {
    resolve({ skipped: true, reason: 'too-early' })
    return
  }

  fetchWeekEventsWithRetry(state)
    .then(function (events) {
      scheduleRecapNotification(events)
      resolve({ skipped: false, count: (events && events.length) || 0 })
    })
    .catch(function (err) {
      var message = (err && err.message) || String(err)
      console.error('[bg-recap] échec du rafraîchissement', message)
      resolve({ skipped: false, error: message })
    })
})

/**
 * Écriture de la configuration depuis l'app (voir backgroundRecap.ts). Seules
 * les clés fournies sont touchées.
 */
addEventListener('configure', function (resolve, reject, args) {
  try {
    var a = args || {}
    if (a.enabled !== undefined) kvSet(KEY_ENABLED, truthy(a.enabled) ? '1' : '0')
    if (a.supabaseUrl !== undefined) kvSet(KEY_SUPABASE_URL, a.supabaseUrl)
    if (a.anonKey !== undefined) kvSet(KEY_ANON_KEY, a.anonKey)
    if (a.householdId !== undefined) kvSet(KEY_HOUSEHOLD_ID, a.householdId)
    if (a.accessToken !== undefined) kvSet(KEY_ACCESS_TOKEN, a.accessToken)
    if (a.refreshToken !== undefined) kvSet(KEY_REFRESH_TOKEN, a.refreshToken)
    resolve({ ok: true })
  } catch (err) {
    reject(err)
  }
})
