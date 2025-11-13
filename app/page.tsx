import Chat from '@/components/Chat';

export default function HomePage() {
  return (
    <main className="container">
      <header className="header">
        <div className="brand">
          <div className="logo" aria-hidden />
          <div>
            <h1>De Jongh?s Panelbeating Centre</h1>
            <p className="tagline">Trusted family-run panel beating and spray painting since 1989</p>
          </div>
        </div>
      </header>
      <Chat />
      <footer className="footer">
        <small>? {new Date().getFullYear()} De Jongh?s Panelbeating Centre</small>
      </footer>
    </main>
  );
}
