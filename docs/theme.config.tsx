import Script from 'next/script';
import type { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: <span style={{ fontWeight: 'bold' }}>Experience SDK</span>,
  project: {
    link: 'https://github.com/prosdevlab/experience-sdk',
  },
  docsRepositoryBase: 'https://github.com/prosdevlab/experience-sdk/tree/main/docs',
  footer: {
    text: (
      <span>
        MIT {new Date().getFullYear()} ©{' '}
        <a href="https://github.com/prosdevlab" target="_blank" rel="noopener">
          prosdevlab
        </a>
      </span>
    ),
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Experience SDK',
    };
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="Experience SDK" />
      <meta
        property="og:description"
        content="A lightweight, explainable client-side experience runtime"
      />
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      <style>{`
        /* Fix code blocks with Tailwind */
        code {
          color: #e74694 !important;
          background-color: #f3f4f6 !important;
          padding: 0.2em 0.4em !important;
          border-radius: 0.25rem !important;
          font-size: 0.875em !important;
        }
        pre {
          padding: 1rem !important;
          border-radius: 0.5rem !important;
          overflow-x: auto !important;
        }
        pre code {
          color: inherit !important;
          background-color: transparent !important;
          padding: 0 !important;
        }
        /* Dark mode overrides */
        .dark code {
          background-color: rgb(55 65 81) !important;
        }
      `}</style>
    </>
  ),
};

export default config;
