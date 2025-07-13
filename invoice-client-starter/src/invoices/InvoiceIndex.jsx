import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchArchivedInvoices,
  deleteInvoice,
  restoreInvoice,
  apiGet,
  getPersons,
  getProducts,
} from "../utils/api";
import InvoiceTable from "./InvoiceTable";

const defaultFilters = {
  buyerID: "",
  sellerID: "",
  product: "",
  minPrice: "",
  maxPrice: "",
  limit: "",
};

export default function InvoiceIndex() {
  const [view, setView] = useState("all");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ ...defaultFilters });
  const [persons, setPersons] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPersons();
        setPersons(data);
        const prods = await getProducts();
        setProducts(prods);
      } catch (err) {
        console.error("Chyba při načítání osob nebo produktů:", err);
      }
    })();
  }, []);

  const loadInvoices = async (filterParams = {}, viewType = view) => {
    setLoading(true);
    try {
      let data = [];
      if (viewType === "archived") {
        data = await fetchArchivedInvoices();
      } else {
        data = await apiGet("/api/invoices", filterParams);
      }
      setInvoices([...data].sort((a, b) => a._id - b._id));
    } catch (err) {
      console.error("Chyba při načítání faktur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices(filters, view);
    // eslint-disable-next-line
  }, [view]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilter = (e) => {
    e.preventDefault();
    loadInvoices(filters, "all");
    setView("all");
  };

  const handleReset = () => {
    setFilters({ ...defaultFilters });
    loadInvoices(defaultFilters, "all");
    setView("all");
  };

  const handleDelete = async (id) => {
    await deleteInvoice(id);
    setInvoices((prev) => prev.filter((f) => f._id !== id));
  };
  const handleRestore = async (id) => {
    await restoreInvoice(id);
    loadInvoices(filters, "archived");
  };

  return (
    <div>
      <div className="btn-group mb-3">
        {[
          ["all", "Všechny"],
          ["archived", "Archiv"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`btn ${
              view === key ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setView(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "all" && (
        <form className="mb-4" onSubmit={handleFilter} autoComplete="off">
          <div className="row g-2 align-items-end">
            <div className="col-md-2 col-sm-6">
              <select
                className="form-select form-select-sm"
                name="buyerID"
                value={filters.buyerID}
                onChange={handleFilterChange}
                title="Odběratel"
              >
                <option value="">Odběratel</option>
                {persons.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p._id} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2 col-sm-6">
              <select
                className="form-select form-select-sm"
                name="sellerID"
                value={filters.sellerID}
                onChange={handleFilterChange}
                title="Dodavatel"
              >
                <option value="">Dodavatel</option>
                {persons.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p._id} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2 col-sm-6">
              <select
                className="form-select form-select-sm"
                name="product"
                value={filters.product}
                onChange={handleFilterChange}
                title="Produkt"
              >
                <option value="">Produkt</option>
                {products.map((prod) => (
                  <option key={prod} value={prod}>
                    {prod}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-1 col-sm-6">
              <input
                className="form-control form-control-sm"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Min"
                type="number"
                min="0"
              />
            </div>
            <div className="col-md-1 col-sm-6">
              <input
                className="form-control form-control-sm"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max"
                type="number"
                min="0"
              />
            </div>
            <div className="col-md-1 col-sm-6">
              <input
                className="form-control form-control-sm"
                name="limit"
                value={filters.limit}
                onChange={handleFilterChange}
                placeholder="Limit"
                type="number"
                min="1"
              />
            </div>
            <div className="col-auto ms-auto d-flex gap-2">
              <button className="btn btn-primary btn-sm" type="submit">
                Filtrovat
              </button>
              <button
                className="btn btn-secondary btn-sm"
                type="button"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      )}

      <p>Počet faktur: {invoices.length}</p>

      {loading ? (
        <p>Načítám…</p>
      ) : (
        <InvoiceTable
          invoices={invoices}
          onDelete={handleDelete}
          onRestore={view === "archived" ? handleRestore : null}
        />
      )}

      {view !== "archived" && (
        <div className="mt-4">
          <Link to="/invoices/create" className="btn btn-success">
            Nová faktura
          </Link>
        </div>
      )}
    </div>
  );
}
