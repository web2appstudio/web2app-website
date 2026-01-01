export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h1 style={{
        fontSize: '3rem',
        fontWeight: 700,
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Web2App Studio
      </h1>
      <p style={{
        fontSize: '1.25rem',
        color: '#888',
        maxWidth: '600px',
        marginBottom: '2rem',
      }}>
        Turn any website into a native Mac app. Coming soon.
      </p>
      <div style={{
        padding: '0.75rem 1.5rem',
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        borderRadius: '8px',
        color: 'white',
        fontWeight: 500,
      }}>
        Launching Soon
      </div>
    </main>
  )
}
