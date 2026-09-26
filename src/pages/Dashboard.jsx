const summaryCards = [
  { label: 'Total Rangers', value: '--' },
  { label: 'Active Patrols', value: '--' },
  { label: 'Incidents', value: '--' },
  { label: 'Active Alerts', value: '--' },
  { label: 'Tracked Animals', value: '--' },
];

function Dashboard() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-semibold text-gray-800">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow p-6 text-gray-500">
        Recent incidents, alerts, patrol coverage map, and charts will appear here once the
        reporting module is implemented.
      </div>
    </div>
  );
}

export default Dashboard;
