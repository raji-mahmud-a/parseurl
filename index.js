/*!
 * parseurl (WHATWG patch) updated to use WHATWG api by Raji Mahmud
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
var legacyParse = legacy.parse
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

  // Return plain object (not legacy Url instance)
  var url = {}

  url.path = str
  url.href = str
  url.pathname = pathname
  url.search = search
  url.query = query
  url.hash = null
  url.host = null
  url.hostname = null
  url.port = null
  url.protocol = null
  url.auth = null

  return url
}

/**
 * Full parse using WHATWG URL with legacy fallback only for catastrophic failures.
 * Maps WHATWG URL fields to legacy-compatible shape.
 *
 * @param {string} str
 * @return {Object}
 * @private
 */

var RELATIVE_BASE = 'http://localhost'

function fullparse (str) {
  if (typeof str !== 'string') {
    return {}
  }

  str = str.trim()

  // Try WHATWG URL first
  if (WHATWG) {
    try {
      var isRelative = str.charCodeAt(0) === 0x2f /* / */ || !str.includes('://')
      var parsedUrl = isRelative ? new WHATWG(str, RELATIVE_BASE) : new WHATWG(str)
      
      var result = {}
      
      // For relative URLs, strip the base from href
      if (isRelative) {
        result.href = str
        result.path = parsedUrl.pathname + parsedUrl.search
      } else {
        result.href = parsedUrl.href
        result.path = parsedUrl.pathname + parsedUrl.search
      }
      
      result.pathname = parsedUrl.pathname
      result.search = parsedUrl.search || null
      result.query = parsedUrl.search ? parsedUrl.search.substring(1) : null
      result.hash = parsedUrl.hash || null
      
      // Only populate protocol/host fields for absolute URLs
      if (parsedUrl.protocol && str.includes('://')) {
        result.protocol = parsedUrl.protocol
        result.host = parsedUrl.host
        result.hostname = parsedUrl.hostname
        result.port = parsedUrl.port || null
        result.auth = (parsedUrl.username || parsedUrl.password)
          ? (parsedUrl.username || '') + (parsedUrl.password ? ':' + parsedUrl.password : '')
          : null
      } else {
        result.protocol = null
        result.host = null
        result.hostname = null
        result.port = null
        result.auth = null
      }
      
      return result
    } catch (err) {
      // WHATWG URL threw - fall through to legacy fallback
    }
  }
  
  // EXTREMELY RARE: Only use legacy parse if WHATWG is unavailable or threw
  // This should almost never happen in Node.js 10+
  if (legacyParse) {
    try {
      return legacyParse(str)
    } catch (err) {
      // Even legacy parse failed
    }
  }
  
  // Ultimate fallback: return minimal object
  return {
    href: str,
    path: str,
    pathname: str,
    search: null,
    query: null,
    hash: null,
    host: null,
    hostname: null,
    port: null,
    protocol: null,
    auth: null
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
  return (
    typeof parsedUrl === 'object' &&
    parsedUrl !== null &&
    parsedUrl._raw === url
  )
    }
