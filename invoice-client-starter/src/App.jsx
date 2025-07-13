import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  BrowserRouter as Router,
  Link,
  Route,
  Routes,
  Navigate,
  Outlet,
} from "react-router-dom";

import PersonIndex from "./persons/PersonIndex";
import PersonDetail from "./persons/PersonDetail";
import PersonForm from "./persons/PersonForm";
import InvoiceForm from "./invoices/InvoiceForm";
import InvoiceIndex from "./invoices/InvoiceIndex";
import InvoiceDetail from "./invoices/InvoiceDetail";
import Statistics from "./statistics/Statistics";

import "./App.css"; // <-- nezapomeň na styl

function InvoicesLayout() {
  return <Outlet />;
}

export function App() {
  return (
    <Router>
      <div className="accounting-bg"> {/* Třída pro účetnické pozadí */}
        <div className="container app-content shadow-lg rounded-4 p-4">
          <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4 rounded-3 px-3">
            <ul className="navbar-nav mr-auto">
              <li className="nav-item">
                <Link to="/persons" className="nav-link text-white fw-bold">
                  Osoby
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/invoices" className="nav-link text-white fw-bold">
                  Faktury
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/statistics" className="nav-link text-white fw-bold">
                  Statistiky
                </Link>
              </li>
            </ul>
          </nav>

          <Routes>
            {/* Redirect root to /invoices */}
            <Route index element={<Navigate to="/persons" />} />

            {/* Persons -------------------------------------------------- */}
            <Route path="/persons">
              <Route index element={<PersonIndex />} />
              <Route path="show/:id" element={<PersonDetail />} />
              <Route path="create" element={<PersonForm />} />
              <Route path="edit/:id" element={<PersonForm />} />
            </Route>

            {/* Statistics ------------------------------------------------ */}
            <Route path="/statistics" element={<Statistics />} />

            {/* Invoices -------------------------------------------------- */}
            <Route path="/invoices" element={<InvoicesLayout />}>
              <Route index element={<InvoiceIndex />} />
              <Route path="create" element={<InvoiceForm />} />
              <Route path="edit/:id" element={<InvoiceForm />} />
              <Route path="show/:id" element={<InvoiceDetail />} />
            </Route>
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
