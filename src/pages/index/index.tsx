import { useEffect, useRef, useState } from "react";
import { shipsApi } from "../../shared/api/product/shipsApi";
import { ProductRowCard } from "../../entities/product";
import { ErrorState, LoadingState, Modal } from "../../shared/ui/components";
import useTitle from "../../shared/lib/useTitle";
import { useShipFilters } from "./params";
import Filters from "./Filters";

export default function IndexPage() {
  useTitle("SpaceX Ships — исследуйте флот");
  const { filters, update, reset } = useShipFilters();
  const [load, result] = shipsApi.useLazyGetShipsQuery();
  const activeRequest = useRef<ReturnType<typeof load> | null>(null);
  const {
    currentData: data,
    isFetching,
    isError,
    error,
    isUninitialized,
  } = result;
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(width < 960px)").matches,
  );
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(width < 960px)");
    const onChange = () => {
      setMobile(media.matches);
      if (!media.matches) setOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  useEffect(() => {
    activeRequest.current = load(filters, true);
    return () => {
      activeRequest.current?.abort();
    };
  }, [filters, load]);
  const busy = isFetching || isUninitialized;
  const filterCount =
    Number(!!filters.search) + filters.port.length + Number(!!filters.type);
  const filterProps = { filters, update, reset };
  return (
    <main id="main" className="page-shell" tabIndex={-1}>
      <section className="hero">
        <div>
          <p className="eyebrow">
            <span className="small-line" /> МОРСКАЯ СТОРОНА КОСМОСА
          </p>
          <h1>
            Флот SpaceX<span className="accent">.</span>
          </h1>
          <p className="hero-description">
            Знакомьтесь с кораблями, которые делают
            <br className="desktop-break" /> космические миссии возможными.
          </p>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <span>SEA</span>
          <span className="orbit-star">✦</span>
          <span>TO SPACE</span>
        </div>
      </section>
      <div className="catalog-layout">
        <section
          className="catalog"
          aria-label="Каталог кораблей"
          aria-busy={busy}
        >
          <div className="catalog-toolbar">
            <div>
              <h2>Корабли</h2>
              <span className="result-count">
                {busy
                  ? "Получаем данные…"
                  : !isError && data
                    ? "Найдено: " + data.totalDocs
                    : "Каталог флота"}
              </span>
            </div>
            {mobile && (
              <button
                className="button button-secondary"
                onClick={() => setOpen(true)}
              >
                Фильтры
                {filterCount > 0 && (
                  <span className="filter-count">{filterCount}</span>
                )}{" "}
                <span aria-hidden="true">☷</span>
              </button>
            )}
          </div>
          {busy ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState
              error={error}
              onRetry={() => {
                activeRequest.current = load(filters);
              }}
            />
          ) : data?.docs.length ? (
            <div className="ship-list">
              {data.docs.map((ship) => (
                <ProductRowCard key={ship.id} {...ship} />
              ))}
            </div>
          ) : (
            <section className="state-panel">
              <span className="state-symbol" aria-hidden="true">
                ⌕
              </span>
              <h2>Корабли не найдены</h2>
              <p>Попробуйте изменить название, порт или тип корабля.</p>
              <button className="button button-primary" onClick={reset}>
                Сбросить фильтры
              </button>
            </section>
          )}
          <nav className="pagination" aria-label="Страницы каталога">
            <span>
              {data && !isError
                ? data.totalPages
                  ? "Страница " + filters.page + " из " + data.totalPages
                  : "Нет результатов"
                : "Страница " + filters.page}
            </span>
            <div>
              <button
                className="icon-button"
                aria-label="Предыдущая страница"
                disabled={
                  busy || isError || !data?.hasPrevPage || !data.prevPage
                }
                onClick={() =>
                  data?.prevPage && update({ page: data.prevPage })
                }
              >
                ←
              </button>
              <span className="page-number" aria-current="page">
                {filters.page}
              </span>
              <button
                className="icon-button"
                aria-label="Следующая страница"
                disabled={
                  busy || isError || !data?.hasNextPage || !data.nextPage
                }
                onClick={() =>
                  data?.nextPage && update({ page: data.nextPage })
                }
              >
                →
              </button>
            </div>
          </nav>
        </section>
        {!mobile && (
          <aside className="desktop-filters" aria-label="Фильтры каталога">
            <Filters {...filterProps} />
          </aside>
        )}
      </div>
      {mobile && open && (
        <Modal onClose={() => setOpen(false)}>
          <Filters {...filterProps} onClose={() => setOpen(false)} />
        </Modal>
      )}
    </main>
  );
}
