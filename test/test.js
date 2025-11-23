var assert = require('assert')
var parseurl = require('..')
var url = require('url')

var URL_EMPTY_VALUE = url.Url
  ? null
  : undefined

describe('parseurl(req)', function () {
  it('should parse the request URL', function () {
    var req = createReq('/foo/bar')
    var url = parseurl(req)
    assert.strictEqual(url.host, URL_EMPTY_VALUE)
    assert.strictEqual(url.hostname, URL_EMPTY_VALUE)
    assert.strictEqual(url.href, '/foo/bar')
    assert.strictEqual(url.pathname, '/foo/bar')
    assert.strictEqual(url.port, URL_EMPTY_VALUE)
    assert.strictEqual(url.query, URL_EMPTY_VALUE)
    assert.strictEqual(url.search, URL_EMPTY_VALUE)
  })

  it('should parse with query string', function () {
    var req = createReq('/foo/bar?fizz=buzz')
    var url = parseurl(req)
    assert.strictEqual(url.host, URL_EMPTY_VALUE)
    assert.strictEqual(url.hostname, URL_EMPTY_VALUE)
    assert.strictEqual(url.href, '/foo/bar?fizz=buzz')
    assert.strictEqual(url.pathname, '/foo/bar')
    assert.strictEqual(url.port, URL_EMPTY_VALUE)
    assert.strictEqual(url.query, 'fizz=buzz')
    assert.strictEqual(url.search, '?fizz=buzz')
  })

  it('should parse with hash', function () {
    var req = createReq('/foo/bar#bazz')
    var url = parseurl(req)
    assert.strictEqual(url.host, URL_EMPTY_VALUE)
    assert.strictEqual(url.hostname, URL_EMPTY_VALUE)
    assert.strictEqual(url.href, '/foo/bar#bazz')
    assert.strictEqual(url.pathname, '/foo/bar')
    assert.strictEqual(url.port, URL_EMPTY_VALUE)
    assert.strictEqual(url.query, URL_EMPTY_VALUE)
    assert.strictEqual(url.search, URL_EMPTY_VALUE)
  })

  it('should parse with query string and hash', function () {
    var req = createReq('/foo/bar?fizz=buzz#bazz')
    var url = parseurl(req)
    assert.strictEqual(url.host, URL_EMPTY_VALUE)
    assert.strictEqual(url.hostname, URL_EMPTY_VALUE)
    assert.strictEqual(url.href, '/foo/bar?fizz=buzz#bazz')
    assert.strictEqual(url.pathname, '/foo/bar')
    assert.strictEqual(url.port, URL_EMPTY_VALUE)
    assert.strictEqual(url.query, 'fizz=buzz')
    assert.strictEqual(url.search, '?fizz=buzz')
  })

  it('should parse a full URL', function () {
    var req = createReq('http://localhost:8888/foo/bar')
    var url = parseurl(req)
    assert.strictEqual(url.host, 'localhost:8888')
    assert.strictEqual(url.hostname, 'localhost')
    assert.strictEqual(url.href, 'http://localhost:8888/foo/bar')
    assert.strictEqual(url.pathname, '/foo/bar')
    assert.strictEqual(url.port, '8888')
    assert.strictEqual(url.query, URL_EMPTY_VALUE)
    assert.strictEqual(url.search, URL_EMPTY_VALUE)
  })

  it('should not choke on auth-looking URL', function () {
    var req = createReq('//todo@txt')
    assert.strictEqual(parseurl(req).pathname, '//todo@txt')
  })

  it('should return undefined missing url', function () {
    var req = createReq()
    var url = parseurl(req)
    assert.strictEqual(url, undefined)
  })

  describe('when using the same request', function () {
    it('should parse multiple times', function () {
      var req = createReq('/foo/bar')
      assert.strictEqual(parseurl(req).pathname, '/foo/bar')
      assert.strictEqual(parseurl(req).pathname, '/foo/bar')
      assert.strictEqual(parseurl(req).pathname, '/foo/bar')
    })

    it('should reflect url changes', function () {
      var req = createReq('/foo/bar')
      var url = parseurl(req)
      var val = Math.random()

      url._token = val
      assert.strictEqual(url._token, val)
      assert.strictEqual(url.pathname, '/foo/bar')

      req.url = '/bar/baz'
      url = parseurl(req)
      assert.strictEqual(url._token, undefined)
      assert.strictEqual(parseurl(req).pathname, '/bar/baz')
    })

    it('should cache parsing', function () {
      var req = createReq('/foo/bar')
      var url = parseurl(req)
      var val = Math.random()

      url._token = val
      assert.strictEqual(url._token, val)
      assert.strictEqual(url.pathname, '/foo/bar')

      url = parseurl(req)
      assert.strictEqual(url._token, val)
      assert.strictEqual(url.pathname, '/foo/bar')
    })

    it('should cache parsing where href does not match', function () {
      var req = createReq('/foo/bar ')
      var url = parseurl(req)
      var val = Math.random()

      url._token = val
      assert.strictEqual(url._token, val)
      assert.strictEqual(url.pathname, '/foo/bar')

      url = parseurl(req)
      assert.strictEqual(url._token, val)
      assert.strictEqual(url.pathname, '/foo/bar')
    })
  })
})

describe('parseurl.original(req)', function () {
  it('should parse the request original URL', function () {
    var req = createReq('/foo/bar', '/foo/bar')
    var url = parseurl.original(req)
    assert.strictEqual(url.host, URL_EMPTY_VALUE)
    assert.strictEqual(url.hostname, URL_EMPTY_VALUE)
    assert.strictEqual(url.href, '/foo/bar')
    assert.strictEqual(url.pathname, '/foo/bar')
    assert.strictEqual(url.port, URL_EMPTY_VALUE)
    assert.strictEqual(url.query, URL_EMPTY_VALUE)
    assert.strictEqual(url.search, URL_EMPTY_VALUE)
  })

  it('should parse originalUrl when different', function () {
    var req = createReq('/bar', '/foo/bar')
    var url = parseurl.original(req)
    assert.strictEqual(url.host, URL_EMPTY_VALUE)
    assert.strictEqual(url.hostname, URL_EMPTY_VALUE)
    assert.strictEqual(url.href, '/foo/bar')
    assert.strictEqual(url.pathname, '/foo/bar')
    assert.strictEqual(url.port, URL_EMPTY_VALUE)
    assert.strictEqual(url.query, URL_EMPTY_VALUE)
    assert.strictEqual(url.search, URL_EMPTY_VALUE)
  })

  it('should parse req.url when originalUrl missing', function () {
    var req = createReq('/foo/bar')
    var url = parseurl.original(req)
    assert.strictEqual(url.host, URL_EMPTY_VALUE)
    assert.strictEqual(url.hostname, URL_EMPTY_VALUE)
    assert.strictEqual(url.href, '/foo/bar')
    assert.strictEqual(url.pathname, '/foo/bar')
    assert.strictEqual(url.port, URL_EMPTY_VALUE)
    assert.strictEqual(url.query, URL_EMPTY_VALUE)
    assert.strictEqual(url.search, URL_EMPTY_VALUE)
  })

  it('should return undefined missing req.url and originalUrl', function () {
    var req = createReq()
    var url = parseurl.original(req)
    assert.strictEqual(url, undefined)
  })

  describe('when using the same request', function () {
    it('should parse multiple times', function () {
      var req = createReq('/foo/bar', '/foo/bar')
      assert.strictEqual(parseurl.original(req).pathname, '/foo/bar')
      assert.strictEqual(parseurl.original(req).pathname, '/foo/bar')
      assert.strictEqual(parseurl.original(req).pathname, '/foo/bar')
    })

    it('should reflect changes', function () {
      var req = createReq('/foo/bar', '/foo/bar')
      var url = parseurl.original(req)
      var val = Math.random()

      url._token = val
      assert.strictEqual(url._token, val)
      assert.strictEqual(url.pathname, '/foo/bar')

      req.originalUrl = '/bar/baz'
      url = parseurl.original(req)
      assert.strictEqual(url._token, undefined)
      assert.strictEqual(parseurl.original(req).pathname, '/bar/baz')
    })

    it('should cache parsing', function () {
      var req = createReq('/foo/bar', '/foo/bar')
      var url = parseurl.original(req)
      var val = Math.random()

      url._token = val
      assert.strictEqual(url._token, val)
      assert.strictEqual(url.pathname, '/foo/bar')

      url = parseurl.original(req)
      assert.strictEqual(url._token, val)
      assert.strictEqual(url.pathname, '/foo/bar')
    })

    it('should cache parsing if req.url changes', function () {
      var req = createReq('/foo/bar', '/foo/bar')
      var url = parseurl.original(req)
      var val = Math.random()

      url._token = val
      assert.strictEqual(url._token, val)
      assert.strictEqual(url.pathname, '/foo/bar')

      req.url = '/baz'
      url = parseurl.original(req)
      assert.strictEqual(url._token, val)
      assert.strictEqual(url.pathname, '/foo/bar')
    })

    it('should cache parsing where href does not match', function () {
      var req = createReq('/foo/bar ', '/foo/bar ')
      var url = parseurl.original(req)
      var val = Math.random()

      url._token = val
      assert.strictEqual(url._token, val)
      assert.strictEqual(url.pathname, '/foo/bar')

      url = parseurl.original(req)
      assert.strictEqual(url._token, val)
      assert.strictEqual(url.pathname, '/foo/bar')
    })
  })
})

/*
 * Additional WHATWG-aware tests added by raji-mahmud-a.
 *
 * These tests were merged into the file in a way that avoids duplicating
 * existing coverage. Tests that asserted already-covered behavior were
 * omitted; the rest were added below to extend coverage (path property,
 * caching _raw, WHATWG field mappings, fragment handling for relative URLs).
 */

describe('parseurl (WHATWG-aware) - tests added by raji-mahmud-a', function () {
  it('parses path-only url and sets pathname, path, href, search, query', function () {
    var req = { url: '/foo/bar?x=1&y=2' }
    var parsed = parseurl(req)
    assert.strictEqual(parsed.path, '/foo/bar?x=1&y=2')
    assert.strictEqual(parsed.href, '/foo/bar?x=1&y=2')
    assert.strictEqual(parsed.pathname, '/foo/bar')
    assert.strictEqual(parsed.search, '?x=1&y=2')
    assert.strictEqual(parsed.query, 'x=1&y=2')
  })

  it('caches parse on req._parsedUrl and returns same object if unchanged', function () {
    var req = { url: '/a?b=1' }
    var p1 = parseurl(req)
    var p2 = parseurl(req)
    assert.strictEqual(p1, p2, 'parseurl should return the same cached object')
    assert.strictEqual(p1._raw, req.url, 'cached object must have _raw equal to req.url')
    // also ensure it's stored on the request
    assert.strictEqual(req._parsedUrl, p1)
  })

  it('parses req.originalUrl when string and caches on _parsedOriginalUrl', function () {
    var req = { url: '/x', originalUrl: '/orig?c=3' }
    var p = parseurl.original(req)
    assert.strictEqual(p.path, '/orig?c=3')
    assert.strictEqual(req._parsedOriginalUrl, p)
  })

  it('full parse maps WHATWG/legacy fields for absolute URLs', function () {
    var req = { url: 'http://example.com:8080/a/b?x=1#frag' }
    var parsed = parseurl(req)

    // protocol and host fields should be mapped
    assert.strictEqual(parsed.protocol, 'http:')
    assert.strictEqual(parsed.host, 'example.com:8080')
    assert.strictEqual(parsed.hostname, 'example.com')
    assert.strictEqual(parsed.port, '8080')

    // path/query/fragment mapping
    assert.strictEqual(parsed.pathname, '/a/b')
    assert.strictEqual(parsed.search, '?x=1')
    assert.strictEqual(parsed.query, 'x=1')
    assert.strictEqual(parsed.hash, '#frag')
  })

  it('handles relative URLs with fragment by delegating to full parser and preserves href', function () {
    var req = { url: '/path#frag' }
    var parsed = parseurl(req)

    // fastparse gives up on '#' and uses fullparse which must preserve hash
    assert.strictEqual(parsed.href, '/path#frag')
    assert.strictEqual(parsed.hash, '#frag')
    assert.strictEqual(parsed.pathname, '/path')
  })
})

function createReq (url, originalUrl) {
  return {
    originalUrl: originalUrl,
    url: url
  }
}
