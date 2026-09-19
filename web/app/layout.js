export const metadata = {
  title: 'FleetHeal — DVIR Intake',
  description: 'Hackathon demo DVIR UI backed by TrueFoundry MCP Gateway',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'ui-sans-serif, system-ui', background: '#0b1220', color: '#e8eefc' }}>
        {children}
      </body>
    </html>
  );
}
