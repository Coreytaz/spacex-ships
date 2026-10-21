import { useEffect, useId, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { ShipFilters } from "../../shared/types/types";

export default function Filters({
  filters,
  update,
  reset,
  onClose,
}: {
  filters: ShipFilters;
  update: (value: Partial<ShipFilters>) => void;
  reset: () => void;
  onClose?: () => void;
}) {
  const [draft, setDraft] = useState(filters.search);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const location = useLocation();
  const id = useId();
  useEffect(() => {
    clearTimeout(timer.current);
    setDraft(filters.search);
    return () => clearTimeout(timer.current);
  }, [location.key, filters.search]);
  const ports = ["Port Canaveral", "Port of Los Angeles", "Fort Lauderdale"];
  const types = ["", "Barge", "Cargo", "High Speed Craft", "Tug"];
  const active = !!(
    filters.search ||
    filters.port.length ||
    filters.type ||
    draft
  );
  return (
    <div className="filters-panel">
      <div className="filters-heading">
        <h2 id="filter-title">Фильтры</h2>
        {onClose && (
          <button
            className="icon-button"
            aria-label="Закрыть фильтры"
            onClick={onClose}
          >
            ×
          </button>
        )}
      </div>
      <div className="filter-field">
        <label htmlFor={id + "-search"}>Название корабля</label>
        <div className="search-input">
          <span aria-hidden="true">⌕</span>
          <input
            id={id + "-search"}
            type="search"
            placeholder="Например, GO Quest"
            value={draft}
            onChange={(event) => {
              const value = event.target.value;
              setDraft(value);
              clearTimeout(timer.current);
              timer.current = setTimeout(() => {
                if (value !== filters.search) update({ search: value });
              }, 300);
            }}
          />
        </div>
      </div>
      <fieldset>
        <legend>Порт приписки</legend>
        {ports.map((port) => (
          <label className="choice" key={port}>
            <input
              type="checkbox"
              value={port}
              checked={filters.port.includes(port)}
              onChange={(event) =>
                update({
                  port: event.target.checked
                    ? [...filters.port, port]
                    : filters.port.filter((value) => value !== port),
                })
              }
            />
            <span>{port}</span>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Тип корабля</legend>
        {types.map((type) => (
          <label className="choice" key={type}>
            <input
              type="radio"
              name={id + "-type"}
              value={type}
              checked={filters.type === type}
              onChange={() => update({ type })}
            />
            <span>{type || "Любой тип"}</span>
          </label>
        ))}
      </fieldset>
      <button
        className="button button-reset"
        disabled={!active}
        onClick={() => {
          clearTimeout(timer.current);
          setDraft("");
          reset();
        }}
      >
        Сбросить фильтры <span aria-hidden="true">↺</span>
      </button>
      {onClose && (
        <button
          className="button button-primary apply-filters"
          onClick={() => {
            clearTimeout(timer.current);
            if (draft !== filters.search) update({ search: draft });
            onClose();
          }}
        >
          Показать результаты <span aria-hidden="true">→</span>
        </button>
      )}
      <p className="filter-note">
        От буксиров до морских платформ — корабли, которые помогают возвращаться
        из космоса.
      </p>
    </div>
  );
}
