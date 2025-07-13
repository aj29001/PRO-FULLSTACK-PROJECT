import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet } from "../utils/api";

// Pomocná funkce na převod ISO data na dd.mm.yyyy
function formatDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day.padStart(2, "0")}.${month.padStart(2, "0")}.${year}`;
}

export default function PersonDetail() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    apiGet(`/api/persons/${id}/`).then(setPerson);
  }, [id]);

  useEffect(() => {
    if (person && person.identificationNumber) {
      apiGet(`/api/identification/${person.identificationNumber}/sales`).then(setSales);
      apiGet(`/api/identification/${person.identificationNumber}/purchases`).then(setPurchases);
    }
  }, [person]);

  if (!person) return <div>Načítám údaje o osobě…</div>;

  const prettyCountry = (country) => {
    if (country === "CZECHIA") return "Česká republika";
    if (country === "SLOVAKIA") return "Slovensko";
    return country || "";
  };

  return (
    <div className="container mt-4">
      <h1>Detail: {person.name}</h1>
      <div className="row mb-3">
        <div className="col-md-6">
          <div className="card shadow mb-3">
            <div className="card-header bg-primary text-white fw-bold">Základní údaje</div>
            <div className="card-body">
              <div><b>Název:</b> {person.name}</div>
              <div><b>IČ:</b> {person.identificationNumber}</div>
              <div><b>DIČ:</b> {person.taxNumber}</div>
              <div><b>Sídlo:</b> {person.street}, {person.zip} {person.city}, {prettyCountry(person.country)}</div>
              <div><b>Poznámka:</b> {person.note}</div>
              <div className="text-muted mt-2"><b>ID osoby:</b> {person._id}</div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow mb-3">
            <div className="card-header bg-success text-white fw-bold">Bankovní a kontaktní údaje</div>
            <div className="card-body">
              <div><b>Bankovní účet:</b> {person.accountNumber}/{person.bankCode}</div>
              <div><b>IBAN:</b> {person.iban}</div>
              <div><b>Telefon:</b> {person.telephone}</div>
              <div><b>Email:</b> {person.mail}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex gap-2 mb-4">
        <Link className="btn btn-warning" to={`/persons/edit/${person._id}`}>Upravit</Link>
        <Link className="btn btn-secondary" to="/persons">Zpět na seznam</Link>
        <Link className="btn btn-success" to="/invoices/create">Nová faktura</Link>
      </div>

      {/* Vystavené faktury */}
      <h3>Vystavené faktury</h3>
      <table className="table table-sm table-bordered mb-5">
        <thead>
          <tr>
            <th>Číslo</th>
            <th>Odběratel</th>
            <th>Produkt</th>
            <th>Cena</th>
            <th>Datum vystavení</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {sales.length > 0 ? sales.map(inv => (
            <tr key={inv._id}>
              <td>{inv.invoiceNumber}</td>
              <td>{inv.buyer?.name}</td>
              <td>{inv.product}</td>
              <td>{inv.price} Kč</td>
              <td>{formatDate(inv.issued)}</td>
              <td>
                <Link className="btn btn-info btn-sm" to={`/invoices/show/${inv._id}`}>Detail</Link>
              </td>
            </tr>
          )) : (
            <tr><td colSpan={6} className="text-muted">Žádné vystavené faktury.</td></tr>
          )}
        </tbody>
      </table>

      {/* Přijaté faktury */}
      <h3>Přijaté faktury</h3>
      <table className="table table-sm table-bordered">
        <thead>
          <tr>
            <th>Číslo</th>
            <th>Dodavatel</th>
            <th>Produkt</th>
            <th>Cena</th>
            <th>Datum vystavení</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {purchases.length > 0 ? purchases.map(inv => (
            <tr key={inv._id}>
              <td>{inv.invoiceNumber}</td>
              <td>{inv.seller?.name}</td>
              <td>{inv.product}</td>
              <td>{inv.price} Kč</td>
              <td>{formatDate(inv.issued)}</td>
              <td>
                <Link className="btn btn-info btn-sm" to={`/invoices/show/${inv._id}`}>Detail</Link>
              </td>
            </tr>
          )) : (
            <tr><td colSpan={6} className="text-muted">Žádné přijaté faktury.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
