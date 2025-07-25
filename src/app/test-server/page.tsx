export default function TestServerPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Server Test Page</h1>
      <p className="text-gray-300">If you can see this, the Next.js server is running successfully!</p>
      <div className="mt-8 space-y-4">
        <div className="bg-green-800 p-4 rounded">
          <h2 className="font-semibold">✅ Server Status: Running</h2>
        </div>
        <div className="bg-blue-800 p-4 rounded">
          <h2 className="font-semibold">🔧 Next Steps:</h2>
          <ul className="mt-2 space-y-1">
            <li>• Navigate to /generator to test the main interface</li>
            <li>• Check database connectivity</li>
            <li>• Test API endpoints</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
