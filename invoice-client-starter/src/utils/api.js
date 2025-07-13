const API_URL = "http://localhost:8000";

// ───────────────────────── pomocná funkce pro volání backendu ─────────────────────────
const fetchData = (url, requestOptions = {}) => {
  const apiUrl = `${API_URL}${url}`;
  return fetch(apiUrl, requestOptions).then((response) => {
    if (!response.ok) {
      throw new Error(
        `Network response was not ok: ${response.status} ${response.statusText}`
      );
    }
    // DELETE vrací 204 No Content → neparsujeme JSON
    if (requestOptions.method === "DELETE") return;
    return response.json();
  });
};

// ───────────────────────── základní metody (GET/POST/PUT/DELETE) ─────────────────────────
export const apiGet = (url, params = {}) => {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value != null && value !== "")
  );
  const queryString = new URLSearchParams(filteredParams).toString();
  const apiUrl = queryString ? `${url}?${queryString}` : url;
  return fetchData(apiUrl, { method: "GET" });
};

export const apiPost = (url, data) =>
  fetchData(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const apiPut = (url, data) =>
  fetchData(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const apiDelete = (url) => fetchData(url, { method: "DELETE" });

// ───────────────────────── endpoints pro filtr „vystavené / přijaté“ ─────────────────────────
export const getSalesInvoicesByIC = (ic) =>
  apiGet(`/api/identification/${ic}/sales`);

export const getPurchaseInvoicesByIC = (ic) =>
  apiGet(`/api/identification/${ic}/purchases`);

// ───────────────────────── archiv / obnova / dobropis ─────────────────────────
export const fetchArchivedInvoices = () => apiGet("/api/invoices/archived/");
export const restoreInvoice       = (id) => apiPost(`/api/invoices/${id}/restore/`);
export const createCreditNote     = (id) => apiPost(`/api/invoices/${id}/create_credit_note/`);

// ───────────────────────── CRUD pro osoby a faktury ─────────────────────────
export const getPersons     = () => apiGet("/api/persons/");
export const createInvoice  = (data) => apiPost("/api/invoices/", data);
export const getAllInvoices = () => apiGet("/api/invoices");
export const getInvoice     = (id) => apiGet(`/api/invoices/${id}/`);
export const updateInvoice  = (id, data) => apiPut(`/api/invoices/${id}/`, data);
export const deleteInvoice  = (id) => apiDelete(`/api/invoices/${id}/`);

// ───────────────────────── nový endpoint pro unikátní produkty ─────────────────────────
export const getProducts = () => apiGet("/api/invoices/product");
