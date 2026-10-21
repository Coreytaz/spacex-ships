import { Route, Routes, Link } from "react-router-dom";
import IndexPage from "./index/index";
import ProductPage from "./product";
export default function Routing() {
  return (
    <Routes>
      <Route path="/" element={<IndexPage />} />
      <Route path="/product/:id" element={<ProductPage />} />
      <Route
        path="*"
        element={
          <main id="main" className="page-shell state-panel">
            <h1>Страница не найдена</h1>
            <Link className="button button-primary" to="/">
              Перейти к каталогу
            </Link>
          </main>
        }
      />
    </Routes>
  );
}
