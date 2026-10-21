import { Link } from "react-router-dom";
import Routing from "../pages";
import "./index.scss";
export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Перейти к содержимому
      </a>
      <header className="site-header">
        <Link to="/" className="brand" aria-label="SpaceX Ships — каталог">
          <span className="brand-mark" aria-hidden="true">
            ✦
          </span>{" "}
          SPACEX <span className="brand-divider" />{" "}
          <span className="brand-subtitle">SHIPS</span>
        </Link>
        <span className="header-caption">Исследуйте флот SpaceX</span>
      </header>
      <Routing />
      <footer className="site-footer">
        <span>SPACEX SHIPS</span>
        <span>Данные открытого API сообщества SpaceX</span>
      </footer>
    </>
  );
}
