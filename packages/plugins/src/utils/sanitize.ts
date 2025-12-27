/**
 * HTML Sanitizer
 *
 * Lightweight HTML sanitizer for experience content (messages, titles).
 * Whitelist-based approach that only allows safe formatting tags.
 *
 * Security: Prevents XSS attacks by stripping dangerous tags and attributes.
 */

/**
 * Allowed HTML tags for sanitization
 * Only safe formatting tags are permitted
 */
const ALLOWED_TAGS = ['strong', 'em', 'a', 'br', 'span', 'b', 'i', 'p'] as const;

/**
 * Allowed attributes per tag
 */
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'class', 'style', 'title'],
  span: ['class', 'style'],
  p: ['class', 'style'],
  // Other tags have no attributes allowed
};

/**
 * Sanitize HTML string by removing dangerous tags and attributes
 *
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string safe for innerHTML
 *
 * @example
 * ```typescript
 * sanitizeHTML('<strong>Hello</strong><script>alert("xss")</script>');
 * // Returns: '<strong>Hello</strong>'
 * ```
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Create a temporary DOM element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  /**
   * Recursively sanitize a DOM node
   */
  function sanitizeNode(node: Node): string {
    // Text nodes - escape HTML entities
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHTML(node.textContent || '');
    }

    // Element nodes
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      // Handle tags with whitespace (malformed HTML like "< script >")
      // Browser normalizes these, but if we see a tag that's not in our list,
      // it might be a dangerous tag that was normalized
      if (!tagName || tagName.includes(' ')) {
        return '';
      }

      // If tag is not allowed, return empty string
      if (!ALLOWED_TAGS.includes(tagName as any)) {
        return '';
      }

      // Get allowed attributes for this tag
      const allowedAttrs = ALLOWED_ATTRIBUTES[tagName] || [];

      // Build attribute string
      const attrs: string[] = [];
      for (const attr of allowedAttrs) {
        const value = element.getAttribute(attr);
        if (value !== null) {
          // Sanitize attribute values
          if (attr === 'href') {
            // Only allow safe URLs (http, https, mailto, tel, relative)
            const sanitizedHref = sanitizeURL(value);
            if (sanitizedHref) {
              attrs.push(`href="${escapeAttribute(sanitizedHref)}"`);
            }
          } else {
            // For all other attributes (title, class, style), escape HTML entities
            attrs.push(`${attr}="${escapeAttribute(value)}"`);
          }
        }
      }

      const attrString = attrs.length > 0 ? ` ${attrs.join(' ')}` : '';

      // Process child nodes
      let innerHTML = '';
      for (const child of Array.from(element.childNodes)) {
        innerHTML += sanitizeNode(child);
      }

      // Self-closing tags
      if (tagName === 'br') {
        return `<br${attrString} />`;
      }

      return `<${tagName}${attrString}>${innerHTML}</${tagName}>`;
    }

    return '';
  }

  // Sanitize all nodes
  let sanitized = '';
  for (const child of Array.from(temp.childNodes)) {
    sanitized += sanitizeNode(child);
  }

  return sanitized;
}

/**
 * Escape HTML entities to prevent XSS in text content
 */
function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Escape HTML entities for use in attribute values
 */
function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitize URL to prevent javascript: and data: XSS attacks
 *
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if unsafe
 */
function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Decode URL-encoded characters to check for encoded attacks
  let decoded: string;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    // If decoding fails, use original
    decoded = url;
  }

  const trimmed = decoded.trim().toLowerCase();

  // Block javascript: and data: protocols (check both original and decoded)
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    url.toLowerCase().trim().startsWith('javascript:') ||
    url.toLowerCase().trim().startsWith('data:')
  ) {
    return '';
  }

  // Allow http, https, mailto, tel, and relative URLs
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('?')
  ) {
    return url; // Return original (case preserved)
  }

  // Allow relative paths without protocol
  if (!trimmed.includes(':')) {
    return url;
  }

  // Block everything else
  return '';
}
