import { FunctionalComponent, h } from "preact";
//import { Link } from "preact-router/match";
import style from "./style.css";

const Header: FunctionalComponent = () => {
  const logoPath = "/assets/images/pixels-logo.png";
  return (
    <header class={style.header}>
      <h1>
        <img class={style.logo} src={logoPath} />
        <text>Odd Or Even?</text>
      </h1>
      {/* <nav>
        <Link activeClassName={style.active} href="/">
          Home
        </Link>
        <Link activeClassName={style.active} href="/profile">
          Me
        </Link>
        <Link activeClassName={style.active} href="/profile/john">
          John
        </Link>
      </nav> */}
    </header>
  );
};

export default Header;
