import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaMoneyBillWave, FaChartLine, FaCalendarCheck } from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCommittees: 0,
    activeCommittees: 0,
    totalMembers: 0,
    totalCollected: 0
  });
  const [committees, setCommittees] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [committeesRes, paymentsRes] = await Promise.all([
        api.get('/committees'),
        api.get('/payments/recent')
      ]);
      
      const committeesData = committeesRes.data;
      setCommittees(committeesData);
      
      // Calculate stats
      const activeCommittees = committeesData.filter(c => c.status === 'active').length;
      const totalMembers = committeesData.reduce((sum, c) => sum + (c.memberCount || 0), 0);
      
      setStats({
        totalCommittees: committeesData.length,
        activeCommittees,
        totalMembers,
        totalCollected: 125000 // This would come from a real API endpoint
      });
      
      setRecentPayments(paymentsRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const chartData = committees.map(committee => ({
    name: committee.name,
    members: committee.memberCount || 0,
    progress: committee.progress || 0
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Committees</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalCommittees}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaCalendarCheck className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Committees</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeCommittees}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaChartLine className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Members</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalMembers}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FaUsers className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Collected</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.totalCollected.toLocaleString()}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FaMoneyBillWave className="text-yellow-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Committee Progress</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="progress" fill="#3498db" name="Progress (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Member Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="members" stroke="#28a745" name="Members" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Committees List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Active Committees</h2>
        </div>
        <div className="divide-y">
          {committees.filter(c => c.status === 'active').map(committee => (
            <div key={committee._id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{committee.name}</h3>
                  <p className="text-sm text-gray-600">
                    {committee.memberCount || 0} members • ₹{committee.totalAmount} total
                  </p>
                  <div className="mt-2">
                    <div className="w-64 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 rounded-full h-2 transition-all duration-300"
                        style={{ width: `${committee.progress || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{Math.round(committee.progress || 0)}% collected</p>
                  </div>
                </div>
                <Link
                  to={`/payments/${committee._id}`}
                  className="btn-primary"
                >
                  Manage
                </Link>
              </div>
            </div>
          ))}
          {committees.filter(c => c.status === 'active').length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No active committees
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;