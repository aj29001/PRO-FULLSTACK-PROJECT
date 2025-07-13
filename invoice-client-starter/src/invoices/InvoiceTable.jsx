import React from "react";
import { Link } from "react-router-dom";

const formatDate = (val) => {
  if (!val) return "-";
  if (val.includes(".")) return val;
  const [yyyy, mm, dd] = val.split("-");
  return `${dd}.${mm}.${yyyy}`;
};

export default function InvoiceTable({ invoices, onDelete, onRestore }) {
  return (
    <table className="table table-striped">
      <thead>
        <tr>
          <th>ID</th>
          <th>Číslo faktury</th>
          <th>Dodavatel</th>
          <th>IČ</th>
          <th>Odběratel</th>
          <th>IČ</th>
          <th>Vystavení</th>
          <th>Splatnost</th>
          <th>Cena</th>
          <th>Akce</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((inv) => (
          <tr key={inv._id}>
            <td>{inv._id}</td>
            <td>{inv.invoiceNumber}</td>
            <td>{inv.seller?.name ?? "-"}</td>
            <td>{inv.seller?.identificationNumber ?? "-"}</td>
            <td>{inv.buyer?.name ?? "-"}</td>
            <td>{inv.buyer?.identificationNumber ?? "-"}</td>
            <td>{formatDate(inv.issued)}</td>
            <td>{formatDate(inv.dueDate)}</td>
            <td>{Number(inv.price).toFixed(2)} Kč</td>
            <td>
              {onRestore ? (
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => onRestore(inv._id)}
                >
                  Obnovit
                </button>
              ) : (
                <>
                  <Link
                    to={`/invoices/show/${inv._id}`}
                    className="btn btn-info btn-sm mx-1"
                  >
                    Zobrazit
                  </Link>
                  <Link
                    to={`/invoices/edit/${inv._id}`}
                    className="btn btn-warning btn-sm mx-1"
                  >
                    Upravit
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      alert(
                        "Fakturu není možné odstranit a trvale smazat, po potvrzení se přesune do archivu, odkud je možné ji obnovit."
                      );
                      onDelete(inv._id);
                    }}
                  >
                    Odstranit
                  </button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
