import { useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { shipsApi } from "../../shared/api/product/shipsApi";
import {
  ErrorState,
  LoadingState,
  ShipImage,
} from "../../shared/ui/components";
import useTitle from "../../shared/lib/useTitle";
export default function ProductPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [
    load,
    { currentData: ship, isFetching, isError, error, isUninitialized },
  ] = shipsApi.useLazyGetShipQuery();
  const activeRequest = useRef<ReturnType<typeof load> | null>(null);
  useEffect(() => {
    activeRequest.current = load(id, true);
    return () => {
      activeRequest.current?.abort();
    };
  }, [id, load]);
  useTitle((ship?.name || "Корабль") + " | SpaceX Ships");
  const facts = ship
    ? [
        ["Тип корабля", ship.type],
        ["Порт приписки", ship.home_port],
        [
          "Масса",
          ship.mass_kg === null
            ? null
            : ship.mass_kg.toLocaleString("ru-RU") + " кг",
        ],
        ["Год постройки", ship.year_built],
        ["Модель", ship.model],
        ["Назначение", ship.roles.join(", ")],
      ]
    : [];
  return (
    <main id="main" className="page-shell detail-page" tabIndex={-1}>
      <button
        className="back-link"
        onClick={() =>
          window.history.state?.idx > 0
            ? navigate(-1)
            : navigate("/", { replace: true })
        }
      >
        <span aria-hidden="true">←</span> К каталогу кораблей
      </button>
      {isFetching || isUninitialized ? (
        <LoadingState />
      ) : isError ? (
        <>
          <ErrorState
            error={error}
            onRetry={() => {
              activeRequest.current = load(id);
            }}
          />
          <Link className="text-link" to="/">
            Открыть каталог
          </Link>
        </>
      ) : (
        ship && (
          <>
            <div className="detail-heading">
              <p className="eyebrow">ФЛОТ SPACEX / {ship.type || "КОРАБЛЬ"}</p>
              <h1>
                {ship.name}
                <span className="accent">.</span>
              </h1>
              <span className={"activity" + (ship.active ? " is-active" : "")}>
                <span aria-hidden="true" />
                {ship.active ? "В эксплуатации" : "Неактивен"}
              </span>
            </div>
            <div className="detail-layout">
              <ShipImage src={ship.image} name={ship.name} large />
              <section className="detail-facts">
                <p className="eyebrow">НА БОРТУ</p>
                <h2>Характеристики</h2>
                <dl>
                  {facts.map(([label, value]) => (
                    <div key={String(label)}>
                      <dt>{label}</dt>
                      <dd>
                        {value === null || value === "" ? "Нет данных" : value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
          </>
        )
      )}
    </main>
  );
}
