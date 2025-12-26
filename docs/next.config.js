/** @type {import('next').NextConfig} */
const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
});

const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/experience-sdk' : '';

module.exports = withNextra({
  output: 'export',
  basePath,
  images: {
    unoptimized: true,
  },
});
