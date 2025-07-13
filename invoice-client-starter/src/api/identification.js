import axios from "axios";

export async function getSalesInvoicesByIC(ic) {
  return await axios.get(`src/api/identification/${ic}/sales/`);
}

export async function getPurchaseInvoicesByIC(ic) {
  return await axios.get(`src/api/identification/${ic}/purchases/`);
}