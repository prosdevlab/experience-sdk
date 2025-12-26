import { latestVersion } from '../content/latest-version';

export function ReleaseBanner() {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginTop: '24px',
        marginBottom: '32px',
      }}
    >
      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
        🎉 v{latestVersion.version} Released!
      </div>
      <div style={{ fontSize: '16px', opacity: 0.95, marginBottom: '12px' }}>
        {latestVersion.summary}
      </div>
      <div style={{ fontSize: '14px', opacity: 0.9 }}>
        {latestVersion.features.map((feature, i) => (
          <span key={i}>
            {i > 0 && ' • '}
            {feature}
          </span>
        ))}
      </div>
      <div style={{ marginTop: '16px', fontSize: '14px' }}>
        <code
          style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '8px 12px',
            borderRadius: '6px',
            fontFamily: 'monospace',
          }}
        >
          npm install @prosdevlab/experience-sdk
        </code>
      </div>
    </div>
  );
}
