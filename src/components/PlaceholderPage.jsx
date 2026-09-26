function PlaceholderPage({ title, description }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-500">{description || 'This module will be implemented in a later phase.'}</p>
    </div>
  );
}

export default PlaceholderPage;
