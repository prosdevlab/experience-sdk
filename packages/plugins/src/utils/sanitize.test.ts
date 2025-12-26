import { describe, expect, it } from 'vitest';
import { sanitizeHTML } from './sanitize';

describe('sanitizeHTML', () => {
  describe('Basic Sanitization', () => {
    it('should allow plain text', () => {
      expect(sanitizeHTML('Hello World')).toBe('Hello World');
    });

    it('should allow allowed tags', () => {
      expect(sanitizeHTML('<strong>Bold</strong>')).toBe('<strong>Bold</strong>');
      expect(sanitizeHTML('<em>Italic</em>')).toBe('<em>Italic</em>');
      expect(sanitizeHTML('<b>Bold</b>')).toBe('<b>Bold</b>');
      expect(sanitizeHTML('<i>Italic</i>')).toBe('<i>Italic</i>');
      expect(sanitizeHTML('<br />')).toBe('<br />');
      expect(sanitizeHTML('<span>Text</span>')).toBe('<span>Text</span>');
      expect(sanitizeHTML('<p>Paragraph</p>')).toBe('<p>Paragraph</p>');
    });

    it('should allow nested allowed tags', () => {
      expect(sanitizeHTML('<p><strong>Bold</strong> text</p>')).toBe(
        '<p><strong>Bold</strong> text</p>'
      );
      expect(sanitizeHTML('<span><em>Italic</em> content</span>')).toBe(
        '<span><em>Italic</em> content</span>'
      );
    });

    it('should allow links with href', () => {
      expect(sanitizeHTML('<a href="/page">Link</a>')).toBe('<a href="/page">Link</a>');
      expect(sanitizeHTML('<a href="https://example.com">Link</a>')).toBe(
        '<a href="https://example.com">Link</a>'
      );
      expect(sanitizeHTML('<a href="http://example.com">Link</a>')).toBe(
        '<a href="http://example.com">Link</a>'
      );
      expect(sanitizeHTML('<a href="mailto:test@example.com">Email</a>')).toBe(
        '<a href="mailto:test@example.com">Email</a>'
      );
      expect(sanitizeHTML('<a href="tel:+1234567890">Call</a>')).toBe(
        '<a href="tel:+1234567890">Call</a>'
      );
    });

    it('should allow class and style attributes', () => {
      expect(sanitizeHTML('<span class="custom">Text</span>')).toBe(
        '<span class="custom">Text</span>'
      );
      expect(sanitizeHTML('<span style="color: red">Text</span>')).toBe(
        '<span style="color: red">Text</span>'
      );
      expect(sanitizeHTML('<a href="/" class="link" style="text-decoration: none">Link</a>')).toBe(
        '<a href="/" class="link" style="text-decoration: none">Link</a>'
      );
    });

    it('should handle empty strings', () => {
      expect(sanitizeHTML('')).toBe('');
    });

    it('should handle text with no HTML', () => {
      expect(sanitizeHTML('Plain text with no tags')).toBe('Plain text with no tags');
    });
  });

  describe('XSS Prevention - Script Tags', () => {
    it('should strip script tags', () => {
      expect(sanitizeHTML('<script>alert("xss")</script>')).toBe('');
      expect(sanitizeHTML('Hello<script>alert("xss")</script>World')).toBe('HelloWorld');
    });

    it('should strip script tags with attributes', () => {
      expect(sanitizeHTML('<script src="evil.js"></script>')).toBe('');
      expect(sanitizeHTML('<script type="text/javascript">alert("xss")</script>')).toBe('');
    });

    it('should strip nested script tags', () => {
      expect(sanitizeHTML('<p><script>alert("xss")</script></p>')).toBe('<p></p>');
      expect(sanitizeHTML('<strong><script>alert("xss")</script></strong>')).toBe(
        '<strong></strong>'
      );
    });

    it('should strip script tags in mixed content', () => {
      expect(sanitizeHTML('<strong>Safe</strong><script>alert("xss")</script><em>Text</em>')).toBe(
        '<strong>Safe</strong><em>Text</em>'
      );
    });
  });

  describe('XSS Prevention - Event Handlers', () => {
    it('should strip onclick attributes', () => {
      expect(sanitizeHTML('<a href="/" onclick="alert(\'xss\')">Link</a>')).toBe(
        '<a href="/">Link</a>'
      );
      expect(sanitizeHTML('<span onclick="alert(\'xss\')">Text</span>')).toBe('<span>Text</span>');
    });

    it('should strip onerror attributes', () => {
      expect(sanitizeHTML('<img src="x" onerror="alert(\'xss\')" />')).toBe('');
      expect(sanitizeHTML('<span onerror="alert(\'xss\')">Text</span>')).toBe('<span>Text</span>');
    });

    it('should strip onload attributes', () => {
      expect(sanitizeHTML('<span onload="alert(\'xss\')">Text</span>')).toBe('<span>Text</span>');
    });

    it('should strip onmouseover attributes', () => {
      expect(sanitizeHTML('<span onmouseover="alert(\'xss\')">Text</span>')).toBe(
        '<span>Text</span>'
      );
    });

    it('should strip all event handler attributes', () => {
      const eventHandlers = [
        'onclick',
        'onerror',
        'onload',
        'onmouseover',
        'onmouseout',
        'onfocus',
        'onblur',
        'onchange',
        'onsubmit',
        'onkeydown',
        'onkeypress',
        'onkeyup',
      ];

      for (const handler of eventHandlers) {
        expect(sanitizeHTML(`<span ${handler}="alert('xss')">Text</span>`)).toBe(
          '<span>Text</span>'
        );
      }
    });
  });

  describe('XSS Prevention - Dangerous Tags', () => {
    it('should strip iframe tags', () => {
      expect(sanitizeHTML('<iframe src="evil.com"></iframe>')).toBe('');
      expect(sanitizeHTML('Text<iframe></iframe>More')).toBe('TextMore');
    });

    it('should strip object tags', () => {
      expect(sanitizeHTML('<object data="evil.swf"></object>')).toBe('');
    });

    it('should strip embed tags', () => {
      expect(sanitizeHTML('<embed src="evil.swf"></embed>')).toBe('');
    });

    it('should strip form tags', () => {
      expect(sanitizeHTML('<form action="evil.com"></form>')).toBe('');
    });

    it('should strip input tags', () => {
      expect(sanitizeHTML('<input type="text" />')).toBe('');
    });

    it('should strip img tags', () => {
      expect(sanitizeHTML('<img src="x.jpg" />')).toBe('');
    });

    it('should strip style tags', () => {
      expect(sanitizeHTML('<style>body { color: red; }</style>')).toBe('');
    });

    it('should strip link tags', () => {
      expect(sanitizeHTML('<link rel="stylesheet" href="evil.css" />')).toBe('');
    });

    it('should strip meta tags', () => {
      expect(sanitizeHTML('<meta http-equiv="refresh" content="0;url=evil.com" />')).toBe('');
    });

    it('should strip video tags', () => {
      expect(sanitizeHTML('<video src="evil.mp4"></video>')).toBe('');
    });

    it('should strip audio tags', () => {
      expect(sanitizeHTML('<audio src="evil.mp3"></audio>')).toBe('');
    });

    it('should strip svg tags', () => {
      expect(sanitizeHTML('<svg><script>alert("xss")</script></svg>')).toBe('');
    });
  });

  describe('XSS Prevention - javascript: URLs', () => {
    it('should strip javascript: URLs in href', () => {
      expect(sanitizeHTML('<a href="javascript:alert(\'xss\')">Link</a>')).toBe('<a>Link</a>');
      expect(sanitizeHTML('<a href="JAVASCRIPT:alert(\'xss\')">Link</a>')).toBe('<a>Link</a>');
      expect(sanitizeHTML('<a href="javascript:void(0)">Link</a>')).toBe('<a>Link</a>');
    });

    it('should strip javascript: URLs with encoded characters', () => {
      expect(sanitizeHTML('<a href="javascript&#58;alert(\'xss\')">Link</a>')).toBe('<a>Link</a>');
    });
  });

  describe('XSS Prevention - data: URLs', () => {
    it('should strip data: URLs in href', () => {
      expect(
        sanitizeHTML('<a href="data:text/html,<script>alert(\'xss\')</script>">Link</a>')
      ).toBe('<a>Link</a>');
      expect(sanitizeHTML('<a href="data:image/svg+xml,<svg>...</svg>">Link</a>')).toBe(
        '<a>Link</a>'
      );
    });
  });

  describe('XSS Prevention - Style-based Attacks', () => {
    it('should allow safe style attributes', () => {
      expect(sanitizeHTML('<span style="color: red">Text</span>')).toBe(
        '<span style="color: red">Text</span>'
      );
    });

    it('should escape HTML in style attributes', () => {
      // Quotes in style attributes are escaped for safety
      const result = sanitizeHTML('<span style="color: \'red\'">Text</span>');
      expect(result).toContain('<span style=');
      expect(result).toContain('Text</span>');
      // The exact escaping format may vary, but quotes should be escaped
      expect(result).not.toContain("color: 'red'");
    });
  });

  describe('XSS Prevention - HTML Entities', () => {
    it('should escape HTML entities in text content', () => {
      expect(sanitizeHTML('<strong>&lt;script&gt;</strong>')).toBe(
        '<strong>&lt;script&gt;</strong>'
      );
      expect(sanitizeHTML('&lt;script&gt;alert("xss")&lt;/script&gt;')).toBe(
        '&lt;script&gt;alert("xss")&lt;/script&gt;'
      );
    });

    it('should escape quotes in attributes', () => {
      expect(sanitizeHTML('<a href="/page" title=\'test"quote\'>Link</a>')).toBe(
        '<a href="/page" title="test&quot;quote">Link</a>'
      );
    });
  });

  describe('XSS Prevention - Nested Attacks', () => {
    it('should handle deeply nested dangerous tags', () => {
      expect(
        sanitizeHTML('<p><span><strong><script>alert("xss")</script></strong></span></p>')
      ).toBe('<p><span><strong></strong></span></p>');
    });

    it('should handle mixed safe and dangerous content', () => {
      expect(
        sanitizeHTML(
          '<strong>Safe</strong><script>alert("xss")</script><em>Also Safe</em><iframe></iframe>'
        )
      ).toBe('<strong>Safe</strong><em>Also Safe</em>');
    });
  });

  describe('XSS Prevention - Edge Cases', () => {
    it('should handle malformed HTML', () => {
      expect(sanitizeHTML('<strong>Unclosed tag')).toBe('<strong>Unclosed tag</strong>');
      expect(sanitizeHTML('</strong>Closing tag without opening')).toBe(
        'Closing tag without opening'
      );
    });

    it('should handle case variations', () => {
      expect(sanitizeHTML('<SCRIPT>alert("xss")</SCRIPT>')).toBe('');
      expect(sanitizeHTML('<Script>alert("xss")</Script>')).toBe('');
      expect(sanitizeHTML('<sCrIpT>alert("xss")</sCrIpT>')).toBe('');
    });

    it('should handle whitespace in tags', () => {
      // Tags with whitespace are treated as text (safe)
      // Browser normalizes tags, so "< script >" becomes text content
      const result1 = sanitizeHTML('< script >alert("xss")</ script >');
      expect(result1).toContain('alert("xss")');
      expect(result1).not.toContain('<script>');

      // Normalized tags work fine
      expect(sanitizeHTML('<strong >Bold</strong>')).toBe('<strong>Bold</strong>');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeHTML(null as any)).toBe('');
      expect(sanitizeHTML(undefined as any)).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeHTML(123 as any)).toBe('');
      expect(sanitizeHTML({} as any)).toBe('');
      expect(sanitizeHTML([] as any)).toBe('');
    });
  });

  describe('Real-world XSS Attack Patterns', () => {
    it('should prevent common XSS payloads', () => {
      // Classic script injection
      expect(sanitizeHTML('<img src=x onerror=alert("xss")>')).toBe('');

      // SVG with script
      expect(sanitizeHTML('<svg><script>alert("xss")</script></svg>')).toBe('');

      // Iframe injection
      expect(sanitizeHTML('<iframe src="javascript:alert(\'xss\')"></iframe>')).toBe('');

      // Event handler in allowed tag
      expect(sanitizeHTML('<a href="/" onclick="alert(\'xss\')">Click</a>')).toBe(
        '<a href="/">Click</a>'
      );

      // Mixed attack
      expect(
        sanitizeHTML(
          '<strong>Welcome</strong><script>alert("xss")</script><a href="javascript:alert(\'xss\')">Link</a>'
        )
      ).toBe('<strong>Welcome</strong><a>Link</a>');
    });

    it('should prevent encoded XSS attacks', () => {
      // HTML entity encoded
      expect(sanitizeHTML('&lt;script&gt;alert("xss")&lt;/script&gt;')).toBe(
        '&lt;script&gt;alert("xss")&lt;/script&gt;'
      );

      // URL encoded javascript: should be decoded and blocked
      // Note: decodeURIComponent will decode %6A%61%76%61%73%63%72%69%70%74%3A to "javascript:"
      const result = sanitizeHTML(
        '<a href="%6A%61%76%61%73%63%72%69%70%74%3Aalert(\'xss\')">Link</a>'
      );
      expect(result).toBe('<a>Link</a>');
    });
  });

  describe('URL Sanitization', () => {
    it('should allow relative URLs', () => {
      expect(sanitizeHTML('<a href="/page">Link</a>')).toBe('<a href="/page">Link</a>');
      expect(sanitizeHTML('<a href="./page">Link</a>')).toBe('<a href="./page">Link</a>');
      expect(sanitizeHTML('<a href="../page">Link</a>')).toBe('<a href="../page">Link</a>');
      expect(sanitizeHTML('<a href="#section">Link</a>')).toBe('<a href="#section">Link</a>');
      expect(sanitizeHTML('<a href="?param=value">Link</a>')).toBe(
        '<a href="?param=value">Link</a>'
      );
    });

    it('should allow http and https URLs', () => {
      expect(sanitizeHTML('<a href="http://example.com">Link</a>')).toBe(
        '<a href="http://example.com">Link</a>'
      );
      expect(sanitizeHTML('<a href="https://example.com">Link</a>')).toBe(
        '<a href="https://example.com">Link</a>'
      );
    });

    it('should allow mailto and tel URLs', () => {
      expect(sanitizeHTML('<a href="mailto:test@example.com">Email</a>')).toBe(
        '<a href="mailto:test@example.com">Email</a>'
      );
      expect(sanitizeHTML('<a href="tel:+1234567890">Call</a>')).toBe(
        '<a href="tel:+1234567890">Call</a>'
      );
    });

    it('should block javascript: URLs regardless of case', () => {
      expect(sanitizeHTML('<a href="javascript:alert(1)">Link</a>')).toBe('<a>Link</a>');
      expect(sanitizeHTML('<a href="JAVASCRIPT:alert(1)">Link</a>')).toBe('<a>Link</a>');
      expect(sanitizeHTML('<a href="JavaScript:alert(1)">Link</a>')).toBe('<a>Link</a>');
    });

    it('should block data: URLs', () => {
      expect(sanitizeHTML('<a href="data:text/html,<script>alert(1)</script>">Link</a>')).toBe(
        '<a>Link</a>'
      );
      expect(sanitizeHTML('<a href="data:image/svg+xml,<svg>...</svg>">Link</a>')).toBe(
        '<a>Link</a>'
      );
    });

    it('should block other dangerous protocols', () => {
      expect(sanitizeHTML('<a href="file:///etc/passwd">Link</a>')).toBe('<a>Link</a>');
      expect(sanitizeHTML('<a href="vbscript:alert(1)">Link</a>')).toBe('<a>Link</a>');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle real-world banner content', () => {
      const content = `
        <strong>Flash Sale!</strong>
        Get <em>50% off</em> everything.
        <a href="/shop">Shop Now</a>
      `;
      const sanitized = sanitizeHTML(content);
      expect(sanitized).toContain('<strong>Flash Sale!</strong>');
      expect(sanitized).toContain('<em>50% off</em>');
      expect(sanitized).toContain('<a href="/shop">Shop Now</a>');
      expect(sanitized).not.toContain('<script>');
    });

    it('should preserve formatting in complex content', () => {
      const content =
        '<p>Welcome! <strong>New</strong> users get <em>special</em> pricing. <a href="/signup">Sign up</a> today!</p>';
      const sanitized = sanitizeHTML(content);
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>New</strong>');
      expect(sanitized).toContain('<em>special</em>');
      expect(sanitized).toContain('<a href="/signup">Sign up</a>');
    });
  });
});
