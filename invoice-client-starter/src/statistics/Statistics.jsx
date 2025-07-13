import React, { useEffect, useState } from "react";
import { apiGet } from "../utils/api";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statRes, compRes] = await Promise.all([
          apiGet("/api/invoices/statistics", { include_archived: true }),
          apiGet("/api/persons/statistics"),
        ]);
        setStats(statRes);

        // Zjisti všechna léta napříč firmami a přidej aktuální rok
        const allYearsSet = new Set();
        compRes.forEach((c) => {
          if (c.revenuePerYear) {
            Object.keys(c.revenuePerYear)
              .map(Number)
              .forEach((y) => allYearsSet.add(y));
          }
        });
        const currentYear = new Date().getFullYear();
        allYearsSet.add(currentYear);
        const lastYears = Array.from(allYearsSet)
          .sort((a, b) => b - a)
          .slice(0, 5);
        setYears(lastYears);

        setCompanies(compRes);
      } catch (err) {
        alert("Chyba při načítání statistik");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div>Načítám…</div>;

  // Data pro sloupcový graf
  const chartData = {
    labels: companies.map((c) => c.personName),
    datasets: [
      {
        label: "Celkové revenue",
        data: companies.map((c) => c.revenue),
        backgroundColor: "rgba(54, 162, 235, 0.7)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Celkové revenue dle společnosti" },
      tooltip: {
        callbacks: {
          label: (ctx) => ctx.parsed.y.toLocaleString("cs-CZ") + " Kč",
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => value.toLocaleString("cs-CZ") + " Kč",
        },
      },
    },
  };

  // Data pro doughnut graf – podle výběru firmy
  let doughnutData, doughnutYears;
  if (selected) {
    const company = companies.find((c) => c.personId === selected);
    doughnutYears = years.slice().reverse();
    doughnutData = {
      labels: doughnutYears.map(String),
      datasets: [
        {
          data: doughnutYears.map(
            (y) =>
              company.revenuePerYear && company.revenuePerYear[y]
                ? company.revenuePerYear[y]
                : 0
          ),
          backgroundColor: [
            "#42A5F5",
            "#66BB6A",
            "#FFA726",
            "#EC407A",
            "#AB47BC",
          ],
        },
      ],
    };
  }

  // ----------- CASH FLOW část -----------
  const cashflowData = companies.map((c) => {
    const cashFlowPerYear = years.map((y) => {
      const revenue = c.revenuePerYear?.[y] || 0;
      const expenses = c.expensesPerYear?.[y] || 0;
      return revenue - expenses;
    });
    return {
      ...c,
      cashFlowPerYear,
      totalCashFlow: cashFlowPerYear.reduce((a, b) => a + b, 0),
    };
  });

  const cashFlowChartData = {
    labels: cashflowData.map((c) => c.personName),
    datasets: [
      {
        label: "Celkové cash flow",
        data: cashflowData.map((c) => c.totalCashFlow),
        backgroundColor: "rgba(255, 99, 132, 0.7)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  };

  // ---------------------------------------

  return (
    <div className="container mt-4">
      {/* 1. sekce: Výpis obecných statistik */}
      <section className="mb-5">
        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="mb-4">Výpis obecných statistik</h2>
            {stats && (
              <ul>
                <li>
                  <strong>Součet za letošní rok:</strong>{" "}
                  {stats.currentYearSum.toLocaleString("cs-CZ")} Kč
                </li>
                <li>
                  <strong>Součet za všechny roky:</strong>{" "}
                  {stats.allTimeSum.toLocaleString("cs-CZ")} Kč
                </li>
                <li>
                  <strong>Počet faktur:</strong> {stats.invoicesCount}
                </li>
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* 2. sekce: Výpis statistik pro jednotlivé společnosti */}
      <section className="mb-5">
        <div className="card shadow-sm">
          <div className="card-body">
            <h3 className="mb-4">Výpis statistik pro jednotlivé společnosti</h3>
            <div style={{ maxWidth: 900, margin: "30px auto" }}>
              <Bar data={chartData} options={chartOptions} />
            </div>

            {selected && doughnutData && (
              <div style={{ maxWidth: 400, margin: "40px auto" }}>
                <h4 className="text-center">
                  Vývoj revenue za posledních 5 let –{" "}
                  {companies.find((c) => c.personId === selected)?.personName}
                </h4>
                <Doughnut
                  data={doughnutData}
                  options={{
                    plugins: {
                      legend: { position: "bottom" },
                      title: { display: true, text: "Revenue za roky" },
                    },
                  }}
                />
              </div>
            )}

            <table
              className="table table-striped"
              style={{ background: "rgba(255,255,255,0.95)" }}
            >
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Jméno</th>
                  <th>Celkové revenue (Kč)</th>
                  {years.map((y) => (
                    <th key={y}>Revenue {y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr
                    key={c.personId}
                    onClick={() => setSelected(c.personId)}
                    style={{
                      cursor: "pointer",
                      background: selected === c.personId ? "#e3f2fd" : undefined,
                    }}
                  >
                    <td>{c.personId}</td>
                    <td>{c.personName}</td>
                    <td>
                      <b>{c.revenue.toLocaleString("cs-CZ")}</b>
                    </td>
                    {years.map((y) => (
                      <td key={y}>
                        {c.revenuePerYear && c.revenuePerYear[y]
                          ? c.revenuePerYear[y].toLocaleString("cs-CZ")
                          : 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-muted">
              Kliknutím na řádek zobrazíte graf vývoje revenue vybrané společnosti.
            </div>
          </div>
        </div>
      </section>

      {/* 3. sekce: Cash Flow */}
      <section className="mb-5">
        <div className="card shadow-sm">
          <div className="card-body">
            <h3 className="mb-4">Cash Flow (příjmy - výdaje) za posledních 5 let</h3>
            <div style={{ maxWidth: 900, margin: "30px auto" }}>
              <Bar
                data={cashFlowChartData}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: { display: true, text: "Celkové cash flow dle společnosti" },
                  },
                }}
              />
            </div>

            <table
              className="table table-striped"
              style={{ background: "rgba(255,255,255,0.95)" }}
            >
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Jméno</th>
                  <th>Celkové cash flow (Kč)</th>
                  {years.map((y) => (
                    <th key={y}>Cash Flow {y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cashflowData.map((c) => (
                  <tr key={c.personId}>
                    <td>{c.personId}</td>
                    <td>{c.personName}</td>
                    <td>
                      <b>{c.totalCashFlow.toLocaleString("cs-CZ")}</b>
                    </td>
                    {c.cashFlowPerYear.map((cf, i) => (
                      <td key={years[i]}>{cf.toLocaleString("cs-CZ")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
