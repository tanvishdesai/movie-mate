"use client"
import React, { useState } from 'react';
import { API_BASE_URL } from '@/utils/api';

const ApiCheckPage = () => {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState('/api/movies');

  // List of endpoints to try
  const endpoints = [
    '/api/movies',
    '/movies',
    '/movie/getallmovies',
    '/api/screens',
    '/screens',
    '/screen/getallscreens',
    '/api/schedules',
    '/schedules',
    '/schedule/getallschedules'
  ];

  const testEndpoint = async (endpoint: string) => {
    try {
      console.log(`Testing endpoint: ${API_BASE_URL}${endpoint}`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      console.log(`Response status for ${endpoint}: ${response.status}`);

      if (response.ok) {
        try {
          const data = await response.json();
          return { 
            status: response.status, 
            success: true, 
            data: JSON.stringify(data).substring(0, 100) + (JSON.stringify(data).length > 100 ? '...' : '')
          };
        } catch (error) {
          return { status: response.status, success: true, data: 'No JSON data' };
        }
      } else {
        return { status: response.status, success: false, error: response.statusText };
      }
    } catch (error: any) {
      return { status: 'Error', success: false, error: error.message };
    }
  };

  const testAllEndpoints = async () => {
    setLoading(true);
    const results: Record<string, any> = {};

    // Test all predefined endpoints
    for (const endpoint of endpoints) {
      results[endpoint] = await testEndpoint(endpoint);
    }

    // Test the custom endpoint if it's not in the list
    if (!endpoints.includes(customEndpoint)) {
      results[customEndpoint] = await testEndpoint(customEndpoint);
    }

    setResults(results);
    setLoading(false);
  };

  const testCustomEndpoint = async () => {
    setLoading(true);
    const result = await testEndpoint(customEndpoint);
    setResults({ [customEndpoint]: result });
    setLoading(false);
  };

  return (
    <div className="admin-card">
      <h1 className="admin-card-title">API Endpoint Checker</h1>
      <p>Use this page to check which API endpoints are working.</p>
      <p>Current API Base URL: <strong>{API_BASE_URL}</strong></p>

      <div className="form-group">
        <label className="form-label">Custom Endpoint:</label>
        <div className="form-row" style={{ alignItems: 'center' }}>
          <input
            type="text"
            value={customEndpoint}
            onChange={(e) => setCustomEndpoint(e.target.value)}
            placeholder="e.g., /api/movies"
            style={{ flex: 3 }}
          />
          <button 
            className="btn btn-primary" 
            onClick={testCustomEndpoint}
            disabled={loading}
            style={{ flex: 1 }}
          >
            Test
          </button>
        </div>
      </div>

      <div className="form-group">
        <button 
          className="btn btn-primary" 
          onClick={testAllEndpoints}
          disabled={loading}
        >
          Test All Endpoints
        </button>
      </div>

      {loading && <div className="loading-spinner"></div>}

      {Object.keys(results).length > 0 && (
        <div className="admin-card">
          <h2 className="admin-card-title">Results</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(results).map(([endpoint, result]: [string, any]) => (
                <tr key={endpoint}>
                  <td>{endpoint}</td>
                  <td>{result.status}</td>
                  <td>
                    {result.success ? (
                      result.data || 'Success'
                    ) : (
                      <span style={{ color: 'var(--error-color)' }}>{result.error}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ApiCheckPage; 