/* global fetchJsonp */

let jsonp = fetchJsonp
document.addEventListener('DOMContentLoaded', main)

async function main() {
    let form = document.querySelector('form')
    form.onsubmit = request_rss

    let url = new URL(window.location.href)
    if (url.searchParams.get('debug') === '1') jsonp = await fetchJsonp_mock()
    let q = url.searchParams.get('q')
    if (q) {
        form.itunes__url.value = q
        form.querySelector('input[type=submit]').click()
    }
}

function request_rss(evt) {
    evt.preventDefault()

    // update window url
    let url = new URL(window.location.href)
    url.searchParams.set('q', this.itunes__url.value)
    window.history.replaceState(null, null, url.toString())

    this.itunes__fieldset.disable = true
    podcast_render()
    status('Reaching Apple cloud...')
    podcast_get(this.itunes__url.value).then(podcast_render).then(status)
        .catch(status).finally( () => this.itunes__fieldset.disable = false)
}

async function podcast_get(url) {
    let id = itunes_id(url); if (!id) throw new Error('invalid url')
    return jsonp(`https://itunes.apple.com/lookup?id=${id}`, {timeout: 10000})
        .catch( _ => { throw new Error('Apple refused to communicate') })
        .then( r => r.json())
        .then( r => {           // validate the result
            if (r && r.results && !r.results.length)
                throw new Error('invalid podcast id')
            return r
        })
}

function itunes_id(url) {
    let u
    try {
        u = new URL(url)
    } catch (_) {
        return null
    }
    if ( !(u.host === 'podcasts.apple.com' || u.host === 'itunes.apple.com'))
        return null
    let m = u.pathname.match(/id([0-9]+)$/)
    return m ? m[1] : null
}

function podcast_render(json) {
    let div = document.querySelector('#podcast')
    if ( !(json && json.results[0])) { div.innerHTML = '';  return }

    console.log(json)
    let d = json.results[0]
    div.innerHTML = `<table style="width: 100%">
<tr><td style="min-width: 4rem"><b>RSS</b></td><td>
  <a href="${e(d.feedUrl)}" target="_blank"><code>${e(d.feedUrl)}</code></a> or
  <a href="https://grepfeed.sigwait.tk/?url=${encodeURIComponent(d.feedUrl)}" target="_blank">preview</a>
</td></tr>
<tr><td>Desc</td><td>
<img src='${e(d.artworkUrl100)}' style="float: right">
${e(d.artistName)}<br>
${e(d.collectionName)}<br>
${e(d.country)}
</td></tr>
<tr><td>Entries</td><td>${e(d.trackCount)}</td></tr>
<tr><td>Genres</td><td>${e(d.genres.join(', '))}</td></tr>
</table>`
}

function status(e) { document.querySelector('#status').innerText = e || ''; }

function e(str) {
    let map = {'&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": 'apos'}
    return String(str == null ? '' : str).replace(/[&<>"']/g, s=>`&${map[s]};`)
}

// curl 'https://itunes.apple.com/lookup?id=253191823' | json | xsel
function fetchJsonp_mock() {
    return import('./cartalk.js').then( module => {
        return async () => ({json: () => module.default})
    })
}
