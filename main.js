/* global fetchJsonp */

let jsonp = fetchJsonp
document.addEventListener('DOMContentLoaded', main)

function main() {
    let form = document.querySelector('form')
    form.onsubmit = request_rss

    let url = new URL(window.location.href)
    if (url.searchParams.get('debug') === '1') jsonp = fetchJsonp_mock
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
        .then( r => r.json())
        .then( r => {           // validate the result
            if (r && r.results && !r.results.length)
                throw new Error('invalid id')
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
    if (u.host !== 'podcasts.apple.com') return null
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
  <a href="https://serene-river-17732.herokuapp.com/?url=${encodeURIComponent(d.feedUrl)}" target="_blank">preview</a>
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

function e(s) {
    if (s == null) return ''
    return s.toString().replace(/[<>&'"]/g, ch => {
        switch (ch) {
        case '<': return '&lt;'
        case '>': return '&gt;'
        case '&': return '&amp;'
        case '\'': return '&apos;'
        case '"': return '&quot;'
        }
    })
}

// curl 'https://itunes.apple.com/lookup?id=253191823' | json | xsel
async function fetchJsonp_mock() {
    return {
        json: () => ({
            "resultCount": 1,
            "results": [{
                "wrapperType": "track",
                "kind": "podcast",
                "artistId": 125443881,
                "collectionId": 253191823,
                "trackId": 253191823,
                "artistName": "NPR",
                "collectionName": "Car Talk",
                "trackName": "Car Talk",
                "collectionCensoredName": "Car Talk",
                "trackCensoredName": "Car Talk",
                "artistViewUrl": "https://podcasts.apple.com/us/artist/npr/125443881?uo=4",
                "collectionViewUrl": "https://podcasts.apple.com/us/podcast/car-talk/id253191823?uo=4",
                "feedUrl": "https://feeds.npr.org/510208/podcast.xml",
                "trackViewUrl": "https://podcasts.apple.com/us/podcast/car-talk/id253191823?uo=4",
                "artworkUrl30": "https://is2-ssl.mzstatic.com/image/thumb/Podcasts123/v4/7b/d3/68/7bd3685e-a074-2cee-4d0f-2dc7b309fd2c/mza_583053047175579130.jpg/30x30bb.jpg",
                "artworkUrl60": "https://is2-ssl.mzstatic.com/image/thumb/Podcasts123/v4/7b/d3/68/7bd3685e-a074-2cee-4d0f-2dc7b309fd2c/mza_583053047175579130.jpg/60x60bb.jpg",
                "artworkUrl100": "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABHPGVmAAAAPFBMVEUHAwkbMkrIDh7CGBzGJi5maGgler3JU1XPYirQdHOekpLbjDWQocfUlJbkqTrkvr/syTjMzdbz5OX9//wRkxQlAAADWklEQVRo3u2Z7bKjIAyGu4EuUApRvP97XT5EEGirFvtnzUznUM7Up0neJEpv5HyjtwtyQaIBQFp2hIDITDWNwPcQWIzeFvvzd7FnD09+BGFKoQqQ+/gYHzPkOY5jP4iYDE7oIY9pHKcxQOyiK4QBmhlyu41ThPQMVwF5/AIymtMh1u4F5Os6IRZC2fxykPv99Dq5j406gZ5tRT2SPRcbO3jyky4Mn+yL73FNxgtyQS7IjyC+VXGptR7sS8tzPAEi9ZCZ7A8BwleIYeDZOIDiDhlmz/d6IofC/JUgv26ElbtbIcBLhnbbPkc+RTxek3NpN7l3/GXmWhAbq5LhorXa1A6zhJTzt4lrP5/ooY5Wsak5pJguiz2eDK1o6WpLthzeCskDI7k1ab82qS/4DST/MI93EM49V5p55cimPPZDUv1z7tUqmxD5zpGPEK+iAHASdtaAuPx4YcN2yFrBLka60QMyiIS3j8rtYhxqCde1I0GmfMO7u9B2nbRko0P0uGxCDhwW1K5IEuPCO0EasdEk6qCV+GOQmkJ07dy3kHqe8F4QyJ4g1pi5m7t+/i2EsrVJP0BkGB+u6O2CxgcyBiwu6R6Imiqj+Yh15Sbif5BgXLI9EKwYpvrE1xBTQbA/ZGpDXLuHXhBWQ1SSXSdII+/MyUmhNSX6QOq8T0RleULmThXaEDTBxH6IWWvBXaIJAVZK/nW4nC1XNfaNoAWUZp5A5gm+VGOjrWQyRpIHZxFCCyJw+RIbGqTVUIK4BqYqSbcg8TOGNcdj3YVXnhCFihGGKYZNSGJsbPWmKnbKqNgAMWr7PCkgwYstnuCOR4c1RFSafh0uPAih/p1BfA+ZF0gPQYK4RNJcG8LMUkbHIeQTRCz6gqOQ6VO4UsU3VbwpJy8SnzdIltqbUK5hwx51hbdm2X3hSdEa1g7VEAxmQm0BdcNEEDVvI7C4UmmTVqMbt56tQPlrWpyOxbIYZrPHW85W9p8CL7nHrZADNheLjZ0qbqX6QSC4YnsLo2pSJ3lC490NTqgonANRc4+kITEiCaczxHYgsH/deMDTPHEJRxsz5hveGYn36lJ08hBzTk5sLzAGlU+NWc3Jrqep/qo03LmJc49sgTBlTirG3B2r4+sY/YJckP8XAqfbjyD/AHqi6yMgOMLEAAAAAElFTkSuQmCC",
                "collectionPrice": 0,
                "trackPrice": 0,
                "trackRentalPrice": 0,
                "collectionHdPrice": 0,
                "trackHdPrice": 0,
                "trackHdRentalPrice": 0,
                "releaseDate": "2020-07-04T12:00:00Z",
                "collectionExplicitness": "notExplicit",
                "trackExplicitness": "notExplicit",
                "trackCount": 4,
                "country": "USA",
                "currency": "USD",
                "primaryGenreName": "Automotive",
                "artworkUrl600": "https://is2-ssl.mzstatic.com/image/thumb/Podcasts123/v4/7b/d3/68/7bd3685e-a074-2cee-4d0f-2dc7b309fd2c/mza_583053047175579130.jpg/600x600bb.jpg",
                "genreIds": ["1503","26","1502","1303"],
                "genres": ["Automotive","Podcasts","Leisure","Comedy"]
            }]
        })
    }
}
