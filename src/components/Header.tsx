export default function Header() {
  return (
    <header className="header">
      {/* ZorgMies logo — place your logo file at /public/logo.svg */}
      <img
        src="/logo.svg"
        alt="ZorgMies logo"
        className="header__logo"
        width={44}
        height={44}
      />
      <div>
        <h1 className="header__title">ZorgMies Dashboard</h1>
        <p className="header__subtitle">
          Regio Bar &middot; Capelle &amp; Prins Alexander &middot; Nissewaard
          &amp; Hoogvliet
        </p>
      </div>
    </header>
  );
}
