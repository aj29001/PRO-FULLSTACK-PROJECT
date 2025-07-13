import React, { useEffect, useState } from "react";
import {
  apiDelete,
  apiGet,
  getSalesInvoicesByIC,
  getPurchaseInvoicesByIC,
} from "../utils/api";
import PersonTable from "./PersonTable";

export default function PersonIndex() {
  const [persons, setPersons] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  /* načtení seznamu osob */
  useEffect(() => {
    apiGet("/api/persons/")
      .then(setPersons)
      .catch(console.error);
  }, []);

  /* pokus o smazání osoby */
  const deletePerson = async (id, identificationNumber) => {
    if (!window.confirm("Opravdu chcete osobu odstranit?")) return;

    try {
      // ověření, zda nemá faktury
      const [sales, purchases] = await Promise.all([
        getSalesInvoicesByIC(identificationNumber),
        getPurchaseInvoicesByIC(identificationNumber),
      ]);

      if (sales.length > 0 || purchases.length > 0) {
        // osoba má navázané faktury → nelze smazat
        throw new Error("navázaná faktura");
      }

      // pokud žádné faktury, povolit smazání
      await apiDelete(`/api/persons/${id}/`);
      // úspěch → aktualizuj lokálně
      setPersons((prev) => prev.filter((p) => p._id !== id));
      setErrorMsg("");
    } catch (err) {
      console.error(err);
      setErrorMsg(
        "Osobu nelze smazat – je pravděpodobně navázaná na existující faktury."
      );
    }
  };

  return (
    <div className="container mt-4">
      <h1>Seznam subjektů</h1>

      {/* chybová hláška */}
      {errorMsg && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          {errorMsg}
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setErrorMsg("")}
          />
        </div>
      )}

      <PersonTable
        items={persons}
        label="Počet osob:"
        deletePerson={deletePerson}
      />
    </div>
  );
}