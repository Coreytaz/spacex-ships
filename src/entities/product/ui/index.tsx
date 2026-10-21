import { Link } from "react-router-dom";
import type { DocShip } from "../../../shared/types/types";
import { ShipImage } from "../../../shared/ui/components";
export default function ProductRowCard(ship: DocShip) {
  return (
    <Link to={"/product/" + ship.id} className="ship-card">
      <ShipImage src={ship.image} name={ship.name} />
      <div className="ship-card-content">
        <div className="ship-card-top">
          <span className="ship-type">{ship.type || "Тип не указан"}</span>
          <span className={"activity" + (ship.active ? " is-active" : "")}>
            <span aria-hidden="true" />
            {ship.active ? "В эксплуатации" : "Неактивен"}
          </span>
        </div>
        <h3>{ship.name}</h3>
        <dl className="ship-card-facts">
          <div>
            <dt>Порт приписки</dt>
            <dd>{ship.home_port || "Не указан"}</dd>
          </div>
          <div>
            <dt>Год постройки</dt>
            <dd>{ship.year_built ?? "Нет данных"}</dd>
          </div>
        </dl>
        <span className="card-link">
          Подробнее о корабле <span aria-hidden="true">↗</span>
        </span>
      </div>
    </Link>
  );
}
