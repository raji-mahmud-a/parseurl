/*!
 * parseurl (WHATWG-aware patch)
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

var legacy = require('url')
var legacyParse = legacy.parse // eslint-disable-line
var LegacyUrl = legacy.Url
var WHATWG = legacy.URL || global.URL

/**
 * Module exports.
 * @public
 */

module.exports = parseurl
module.exports.original = originalurl

/**
 * Parse the `req` url with memoization.
 *
 * @param {ServerRequest} req
 * @return {Object}
 * @public
 */

function parseurl (req) {
  var url = req.url

  if (url === undefined) {
    // URL is undefined
    return undefined
  }

  var parsed = req._parsedUrl

  if (fresh(url, parsed)) {
    // Return cached URL parse
    return parsed
  }

  // Parse the URL (fast-path -> full parser)
  parsed = fastparse(url)
  // mark raw for freshness check
  parsed._raw = url

  return (req._parsedUrl = parsed)
}

/**
 * Parse the `req` original url with fallback and memoization.
 *
 * @param {ServerRequest} req
 * @return {Object}
 * @public
 */

function originalurl (req) {
  var url = req.originalUrl

  if (typeof url !== 'string') {
    // Fallback
    return parseurl(req)
  }

  var parsed = req._parsedOriginalUrl

  if (fresh(url, parsed)) {
    // Return cached URL parse
    return parsed
  }

  // Parse the URL
  parsed = fastparse(url)
  parsed._raw = url

  return (req._parsedOriginalUrl = parsed)
}

/**
 * Parse the `str` url with fast-path short-cut for common path-only inputs.
 *
 * @param {string} str
 * @return {Object}
 * @private
 */

function fastparse (str) {
  if (typeof str !== 'string' || str.charCodeAt(0) !== 0x2f /* / */) {
    return fullparse(str)
  }

  var pathname = str
  var query = null
  var search = null

  // This takes the regexp from https://github.com/joyent/node/pull/7878
  // Which is /^(\/[^?#\s]*)(\?[^#\s]*)?$/
  // And unrolls it into a for loop
  for (var i = 1; i < str.length; i++) {
    switch (str.charCodeAt(i)) {
      case 0x3f: /* ?  */
        if (search === null) {
          pathname = str.substring(0, i)
          query = str.substring(i + 1)
          search = str.substring(i)
        }
        break
      case 0x09: /* \t */
      case 0x0a: /* \n */
      case 0x0c: /* \f */
      case 0x0d: /* \r */
      case 0x20: /*    */
      case 0x23: /* #  */
      case 0xa0:
      case 0xfeff:
        // Give up on fast path if we encounter spaces, control chars, or '#'
        return fullparse(str)
    }
  }

  // Keep compatibility with legacy behavior: prefer legacy Url instance when available
  var url = LegacyUrl !== undefined
    ? new LegacyUrl()
    : {}

  url.path = str
  url.href = str
  url.pathname = pathname

  if (search !== null) {
    url.query = query
    url.search = search
  } else {
    url.search = null
    url.query = null
  }

  return url
}

/**
 * Full parse that prefers WHATWG URL but falls back to legacy url.parse.
 * Maps WHATWG URL fields back to the legacy shape used by many callers.
 *
 * @param {string} str
 * @return {Object}
 * @private
 */

var RELATIVE_BASE = 'http://example' // harmless base for relative URLs

function fullparse (str) {
  // If WHATWG URL is not available, fallback to legacy parse
  if (!WHATWG) return legacyParse(str)

  try {
    var usedRelativeBase = (typeof str === 'string' && str.charCodeAt(0) === 0x2f)
    // WHATWG URL needs a base for relative paths
    var u = usedRelativeBase ? new WHATWG(str, RELATIVE_BASE) : new WHATWG(str)

    // We'll return the WHATWG URL instance (so callers can use URL API),
    // but map legacy-like fields onto it for compatibility with code
    // that expects url.parse() shape.
    var out = u

    // Compute href/path as the original input for relative URLs (strip the base)
    var rawHref = u.href
    if (usedRelativeBase && rawHref.indexOf(RELATIVE_BASE) === 0) {
      rawHref = rawHref.slice(RELATIVE_BASE.length)
      if (rawHref === '') rawHref = '/'
    }

    out.href = rawHref
    out.path = (u.pathname || '') + (u.search || '')
    out.pathname = u.pathname || null
    out.search = u.search || null
    out.query = u.search ? u.search.slice(1) : null
    out.hash = u.hash || null
    out.host = u.host || null
    out.hostname = u.hostname || null
    out.port = u.port || null
    out.protocol = u.protocol || null

    // Synthesize legacy .auth from username/password when present
    if (u.username || u.password) {
      out.auth = (u.username || '') + (u.password ? ':' + u.password : '')
    } else {
      out.auth = null
    }

    return out
  } catch (e) {
    // WHATWG URL can throw for some malformed inputs; fall back to legacy parse
    return legacyParse(str)
  }
}

/**
 * Determine if parsed is still fresh for url.
 *
 * @param {string} url
 * @param {object} parsedUrl
 * @return {boolean}
 * @private
 */

function fresh (url, parsedUrl) {
  if (typeof parsedUrl !== 'object' || parsedUrl === null) return false
  if (parsedUrl._raw !== url) return false

  // If one or both constructors exist, accept instances of either.
  if (LegacyUrl || WHATWG) {
    var isLegacyInstance = LegacyUrl && (parsedUrl instanceof LegacyUrl)
    var isWHATWGInstance = WHATWG && (parsedUrl instanceof WHATWG)
    return isLegacyInstance || isWHATWGInstance
  }

  // No Url constructors available in environment, accept plain objects.
  return true
  }
  if (url === undefined) {
    // URL is undefined
    return undefined
  }

  var parsed = req._parsedUrl

  if (fresh(url, parsed)) {
    // Return cached URL parse
    return parsed
  }

  // Parse the URL
  parsed = fastparse(url)
  parsed._raw = url

  return (req._parsedUrl = parsed)
};

/**
 * Parse the `req` original url with fallback and memoization.
 *
 * @param {ServerRequest} req
 * @return {Object}
 * @public
 */

function originalurl (req) {
  var url = req.originalUrl

  if (typeof url !== 'string') {
    // Fallback
    return parseurl(req)
  }

  var parsed = req._parsedOriginalUrl

  if (fresh(url, parsed)) {
    // Return cached URL parse
    return parsed
  }

  // Parse the URL
  parsed = fastparse(url)
  parsed._raw = url

  return (req._parsedOriginalUrl = parsed)
};

/**
 * Parse the `str` url with fast-path short-cut.
 *
 * @param {string} str
 * @return {Object}
 * @private
 */

function fastparse (str) {
  if (typeof str !== 'string' || str.charCodeAt(0) !== 0x2f /* / */) {
    return parse(str)
  }

  var pathname = str
  var query = null
  var search = null

  // This takes the regexp from https://github.com/joyent/node/pull/7878
  // Which is /^(\/[^?#\s]*)(\?[^#\s]*)?$/
  // And unrolls it into a for loop
  for (var i = 1; i < str.length; i++) {
    switch (str.charCodeAt(i)) {
      case 0x3f: /* ?  */
        if (search === null) {
          pathname = str.substring(0, i)
          query = str.substring(i + 1)
          search = str.substring(i)
        }
        break
      case 0x09: /* \t */
      case 0x0a: /* \n */
      case 0x0c: /* \f */
      case 0x0d: /* \r */
      case 0x20: /*    */
      case 0x23: /* #  */
      case 0xa0:
      case 0xfeff:
        return parse(str)
    }
  }

  var url = Url !== undefined
    ? new Url()
    : {}

  url.path = str
  url.href = str
  url.pathname = pathname

  if (search !== null) {
    url.query = query
    url.search = search
  }

  return url
}

/**
 * Determine if parsed is still fresh for url.
 *
 * @param {string} url
 * @param {object} parsedUrl
 * @return {boolean}
 * @private
 */

function fresh (url, parsedUrl) {
  return typeof parsedUrl === 'object' &&
    parsedUrl !== null &&
    (Url === undefined || parsedUrl instanceof Url) &&
    parsedUrl._raw === url
}
