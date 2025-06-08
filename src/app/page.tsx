'use client';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            W3PI - Web3 Portfolio Intelligence
          </h1>
          <p className="text-xl text-gray-600">
            Decentralized portfolio management built with ink! smart contracts
          </p>
        </div>

        <div className="card max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Setup Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Typink Provider initialized</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Development network ready</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Contracts pending deployment</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Next: Deploy your contracts and add them to the deployments configuration
          </p>
        </div>
      </div>
    </div>
  );
}