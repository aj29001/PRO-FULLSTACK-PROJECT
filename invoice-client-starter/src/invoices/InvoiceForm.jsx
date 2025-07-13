import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createInvoice,
  updateInvoice,
  getInvoice,
  getPersons,
  createCreditNote,
} from "../utils/api";

const normalizeNumber = (v) => (v === "" ? 0 : Number(String(v).replace(",", ".")));

// Převod zápisu datumu mezi formáty
const czToIso = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr.includes(".")) {
    const [dd, mm, yyyy] = dateStr.split(".");
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return dateStr; // už je ISO
};
const isoToCz = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr.includes("-")) {
    const [yyyy, mm, dd] = dateStr.split("-");
    return `${dd}.${mm}.${yyyy}`;
  }
  return dateStr; // už je CZ
};

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [people, setPeople] = useState([]);
  const [form, setForm] = useState({
    invoiceNumber: "",
    seller: "",
    buyer: "",
    issued: "",
    dueDate: "",
    product: "",
    price: "",
    vat: "",
    note: "",
  });
  const [invalidIssued, setInvalidIssued] = useState(false);
  const [invalidDueDate, setInvalidDueDate] = useState(false);
  const [canEdit, setCanEdit] = useState(!id);

  useEffect(() => {
    getPersons().then(setPeople);

    if (id) {
      getInvoice(id).then((inv) => {
        setForm({
          invoiceNumber: inv.invoiceNumber,
          seller: inv.seller._id,
          buyer: inv.buyer._id,
          issued: isoToCz(inv.issued),
          dueDate: isoToCz(inv.dueDate),
          product: inv.product,
          price: inv.price,
          vat: inv.vat,
          note: inv.note,
        });
        setCanEdit(false);
      });
    }
  }, [id]);

  // Handler pro ostatní pole
  const handle = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // Handler pro výběr datumu z kalendáře
  const handleDateChange = (e) => {
    const name = e.target.name;
    const iso = e.target.value; // yyyy-mm-dd
    if (iso) {
      const [yyyy, mm, dd] = iso.split("-");
      setForm((prev) => ({ ...prev, [name]: `${dd}.${mm}.${yyyy}` }));
    } else {
      setForm((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      invoiceNumber: form.invoiceNumber,
      seller: { _id: Number(form.seller) },
      buyer: { _id: Number(form.buyer) },
      issued: czToIso(form.issued),    // ← TADY!
      dueDate: czToIso(form.dueDate),  // ← TADY!
      product: form.product,
      price: normalizeNumber(form.price),
      vat: normalizeNumber(form.vat),
      note: form.note !== undefined && form.note !== null ? String(form.note) : "",
  };

    
    try {
      if (id) {
        await updateInvoice(id, payload);
      } else {
        await createInvoice(payload);
      }
      navigate("/invoices");
    } catch (err) {
      alert("Chyba při ukládání faktury: " + err);
      console.error(err);
    }
  };

  const handleCredit = async () => {
    if (!id) return;
    try {
      await createCreditNote(id);
      setCanEdit(true);
    } catch (err) {
      alert("Nepodařilo se vytvořit dobropis: " + err);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-4">
      <h2>{id ? "Upravit fakturu" : "Nová faktura"}</h2>

      {id && (
        <p className="text-muted" style={{ fontSize: "0.9rem" }}>
          Nejprve vytvoř dobropis, poté uprav fakturu a ulož změny jako novou.
        </p>
      )}

      {id && !canEdit && (
        <button
          type="button"
          className="btn btn-warning mb-3"
          onClick={handleCredit}
        >
          Vytvořit dobropis
        </button>
      )}

      <input
        className="form-control mb-2"
        placeholder="Číslo faktury"
        name="invoiceNumber"
        value={form.invoiceNumber}
        onChange={handle}
        required
        disabled={!!id}
      />

      {["seller", "buyer"].map((f) => (
        <select
          key={f}
          className="form-select mb-2"
          name={f}
          value={form[f]}
          onChange={handle}
          required
          disabled={!canEdit}
        >
          <option value="">
            -- {f === "seller" ? "Dodavatel" : "Odběratel"} --
          </option>
          {people.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      ))}

      {/* Datum vystavení */}
      <div className="form-floating mb-2">
        <input
          type="date"
          className={`form-control ${invalidIssued ? "is-invalid" : ""}`}
          id="issued"
          name="issued"
          value={form.issued ? czToIso(form.issued) : ""}
          onChange={handleDateChange}
          required
          disabled={!canEdit}
        />
        <label htmlFor="issued">Datum vystavení</label>
        {invalidIssued && (
          <div className="invalid-feedback">Zadej datum ve formátu dd.mm.rrrr</div>
        )}
      </div>

      {/* Datum splatnosti */}
      <div className="form-floating mb-2">
        <input
          type="date"
          className={`form-control ${invalidDueDate ? "is-invalid" : ""}`}
          id="dueDate"
          name="dueDate"
          value={form.dueDate ? czToIso(form.dueDate) : ""}
          onChange={handleDateChange}
          required
          disabled={!canEdit}
        />
        <label htmlFor="dueDate">Datum splatnosti</label>
        {invalidDueDate && (
          <div className="invalid-feedback">Zadej datum ve formátu dd.mm.rrrr</div>
        )}
      </div>

      {/* Zbytek polí */}
      <input
        className="form-control mb-2"
        placeholder="Produkt / služba"
        name="product"
        value={form.product}
        onChange={handle}
        required
        disabled={!canEdit}
      />

      <input
        type="text"
        className="form-control mb-2"
        placeholder="Cena"
        name="price"
        value={form.price}
        onChange={handle}
        required
        disabled={!canEdit}
      />

      <input
        type="text"
        className="form-control mb-2"
        placeholder="DPH %"
        name="vat"
        value={form.vat}
        onChange={handle}
        required
        disabled={!canEdit}
      />

      <textarea
        className="form-control mb-3"
        placeholder="Poznámka"
        name="note"
        value={form.note}
        onChange={handle}
        disabled={!canEdit}
      />

      <button className="btn btn-primary" type="submit" disabled={!canEdit}>
        {id ? "Uložit změny" : "Uložit"}
      </button>
    </form>
  );
}