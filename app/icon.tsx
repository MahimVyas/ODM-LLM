import { ImageResponse } from 'next/og';

// Next.js will use these to generate the correct meta tags
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1A1A1A',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          border: '2px solid #3F3F3F',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
        }}
      >
        {/* A sleek, modern typographic logo for ODM */}
        <div
          style={{
            color: '#F3F4F6',
            fontSize: '18px',
            fontWeight: 'bold',
            fontFamily: 'sans-serif',
            letterSpacing: '-1px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          O<span style={{ color: '#3B82F6', marginLeft: '1px' }}>D</span>
        </div>
      </div>
    ),
    { ...size }
  );
}