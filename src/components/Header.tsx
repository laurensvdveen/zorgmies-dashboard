import HeaderClock from "@/components/HeaderClock";
import HeaderWeather from "@/components/HeaderWeather";

export default function Header() {
  return (
    <header className="header">
      <div className="header__left">
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
      </div>
      <div className="header__right">
        <HeaderWeather />
        <div className="header__divider" />
        <HeaderClock />
      </div>
    </header>
  );
}
