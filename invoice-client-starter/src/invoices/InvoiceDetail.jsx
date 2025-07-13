import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet, restoreInvoice } from "../utils/api";

// Funkce na překlad kódu země
const translateCountry = (country) => {
  if (!country) return "-";
  if (country.toUpperCase() === "CZECHIA") return "Česká republika";
  if (country.toUpperCase() === "SLOVAKIA") return "Slovensko";
  return country;
};

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    apiGet(`/api/invoices/${id}/`).then(setInvoice);
  }, [id]);

  const formatDate = (val) => {
    if (!val) return "-";
    if (val.includes(".")) return val;
    const [yyyy, mm, dd] = val.split("-");
    return `${dd}.${mm}.${yyyy}`;
  };

  if (!invoice) return <p>Načítání…</p>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">
        Faktura č. {invoice.invoiceNumber}
      </h2>
      <div className="row g-4">
        {/* Dodavatel */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-primary text-white fw-bold">
              Dodavatel
            </div>
            <div className="card-body">
              <p><strong>Název:</strong> {invoice.seller?.name}</p>
              <p><strong>IČ:</strong> {invoice.seller?.identificationNumber}</p>
              <p><strong>DIČ:</strong> {invoice.seller?.taxNumber}</p>
              <p><strong>Účet:</strong> {invoice.seller?.accountNumber}/{invoice.seller?.bankCode}</p>
              <p><strong>IBAN:</strong> {invoice.seller?.iban}</p>
              <p><strong>Telefon:</strong> {invoice.seller?.telephone}</p>
              <p><strong>Email:</strong> {invoice.seller?.mail}</p>
              <p><strong>Adresa:</strong> {invoice.seller?.street}, {invoice.seller?.zip} {invoice.seller?.city}</p>
              <p><strong>Země:</strong> {translateCountry(invoice.seller?.country)}</p>
              <p><strong>Poznámka:</strong> {invoice.seller?.note}</p>
              <p className="text-muted"><strong>ID dodavatele:</strong> {invoice.seller?._id}</p>
            </div>
          </div>
        </div>
        {/* Odběratel */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-success text-white fw-bold">
              Odběratel
            </div>
            <div className="card-body">
              <p><strong>Název:</strong> {invoice.buyer?.name}</p>
              <p><strong>IČ:</strong> {invoice.buyer?.identificationNumber}</p>
              <p><strong>DIČ:</strong> {invoice.buyer?.taxNumber}</p>
              <p><strong>Účet:</strong> {invoice.buyer?.accountNumber}/{invoice.buyer?.bankCode}</p>
              <p><strong>IBAN:</strong> {invoice.buyer?.iban}</p>
              <p><strong>Telefon:</strong> {invoice.buyer?.telephone}</p>
              <p><strong>Email:</strong> {invoice.buyer?.mail}</p>
              <p><strong>Adresa:</strong> {invoice.buyer?.street}, {invoice.buyer?.zip} {invoice.buyer?.city}</p>
              <p><strong>Země:</strong> {translateCountry(invoice.buyer?.country)}</p>
              <p><strong>Poznámka:</strong> {invoice.buyer?.note}</p>
              <p className="text-muted"><strong>ID odběratele:</strong> {invoice.buyer?._id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Údaje o faktuře */}
      <div className="row g-4 mt-2">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-dark text-white fw-bold">
              Údaje o faktuře
            </div>
            <div className="card-body row">
              <div className="col-md-4">
                <p><strong>Produkt:</strong> {invoice.product}</p>
                <p><strong>Cena:</strong> {Number(invoice.price).toFixed(2)} Kč</p>
                <p><strong>DPH:</strong> {invoice.vat} %</p>
              </div>
              <div className="col-md-4">
                <p><strong>Datum vystavení:</strong> {formatDate(invoice.issued)}</p>
                <p><strong>Datum splatnosti:</strong> {formatDate(invoice.dueDate)}</p>
              </div>
              <div className="col-md-4">
                <p><strong>Poznámka k faktuře:</strong> {invoice.note}</p>
                <p className="text-muted"><strong>ID faktury:</strong> {invoice._id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Akce */}
      <div className="mt-4 d-flex gap-2 flex-wrap">
        <Link to={`/invoices/edit/${invoice._id}`} className="btn btn-warning">
          Upravit
        </Link>
        <Link to="/invoices/create" className="btn btn-success">
          Nová faktura
        </Link>
        <Link to="/invoices" className="btn btn-secondary">
          Zpět na seznam
        </Link>
        {invoice.archived && (
          <button
            className="btn btn-success"
            onClick={async () => {
              try {
                await restoreInvoice(invoice._id);
                alert("Faktura byla obnovena.");
                window.location.href = "/invoices";
              } catch (err) {
                alert("Obnova faktury selhala.");
                console.error(err);
              }
            }}
          >
            Obnovit fakturu
          </button>
        )}
      </div>
    </div>
  );
}