import type { DocShip, Ships } from "../src/shared/types/types";
export const ship: DocShip = {
  id: "ship-1",
  name: "GO Quest",
  type: "Tug",
  home_port: "Port Canaveral",
  image: null,
  mass_kg: 502000,
  year_built: 2015,
  active: true,
  roles: ["Support"],
  model: null,
};
export const ships: Ships = {
  docs: [ship],
  totalDocs: 6,
  limit: 5,
  page: 1,
  totalPages: 2,
  hasPrevPage: false,
  hasNextPage: true,
  prevPage: null,
  nextPage: 2,
};
