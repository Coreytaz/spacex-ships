export interface DocShip {
  id: string;
  name: string;
  type: string | null;
  home_port: string | null;
  image: string | null;
  mass_kg: number | null;
  year_built: number | null;
  active: boolean;
  roles: string[];
  model: string | null;
}
export interface Ships {
  docs: DocShip[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}
export interface ShipFilters {
  search: string;
  port: string[];
  type: string;
  page: number;
}
