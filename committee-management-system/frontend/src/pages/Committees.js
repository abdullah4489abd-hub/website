import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaEye, FaPlus } from 'react-icons/fa';
import Modal from 'react-modal';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

Modal.setAppElement('#root');

const Committees = () => {
  const { user } = useAuth();
  const [committees, setCommittees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    totalAmount: '',
    monthlyInstallment: '',
    totalMembers: '',
    lateFeePerDay: 100
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommittees();
  }, []);

  const fetchCommittees = async () => {
    try {
      const response = await api.get('/committees');
      setCommittees(response.data);
    } catch (error) {
      console.error('Error fetching committees:', error);
      toast.error('Failed to load committees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCommittee) {
        await api.put(`/committees/${editingCommittee._id}`, formData);
        toast.success('Committee updated successfully');
      } else {
        await api.post('/committees', formData);
        toast.success('Committee created successfully');
      }
      fetchCommittees();
      closeModal();
    } catch (error) {
      console.error('Error saving committee:', error);
      toast.error(error.response?.data?.error || 'Failed to save committee');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this committee?')) {
      try {
        await api.delete(`/committees/${id}`);
        toast.success('Committee deleted successfully');
        fetchCommittees();
      } catch (error) {
        console.error('Error deleting committee:', error);
        toast.error('Failed to delete committee');
      }
    }
  };

  const openModal = (committee = null) => {
    if (committee) {
      setEditingCommittee(committee);
      setFormData({
        name: committee.name,
        startDate: committee.startDate.split('T')[0],
        endDate: committee.endDate.split('T')[0],
        totalAmount: committee.totalAmount,
        monthlyInstallment: committee.monthlyInstallment,
        totalMembers: committee.totalMembers,
        lateFeePerDay: committee.lateFeePerDay || 100
      });
    } else {
      setEditingCommittee(null);
      setFormData({
        name: '',
        startDate: '',
        endDate: '',
        totalAmount: '',
        monthlyInstallment: '',
        totalMembers: '',
        lateFeePerDay: 100
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCommittee(null);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      upcoming: 'status-upcoming',
      active: 'status-active',
      completed: 'status-completed'
    };
    return `px-3 py-1 rounded-full text-sm font-semibold ${statusMap[status]}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Committees</h1>
          <p className="text-gray-600">Manage all your committees</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <FaPlus /> Create Committee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {committees.map(committee => (
          <div key={committee._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">{committee.name}</h3>
                <span className={getStatusBadge(committee.status)}>
                  {committee.status.toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Start:</span> {new Date(committee.startDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">End:</span> {new Date(committee.endDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Total Amount:</span> ₹{committee.totalAmount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Monthly Installment:</span> ₹{committee.monthlyInstallment.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Members:</span> {committee.memberCount || 0}/{committee.totalMembers}
                </p>
              </div>

              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 rounded-full h-2 transition-all duration-300"
                    style={{ width: `${committee.progress || 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{Math.round(committee.progress || 0)}% completed</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openModal(committee)}
                  className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600 transition flex items-center justify-center gap-1"
                >
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => handleDelete(committee._id)}
                  className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition flex items-center justify-center gap-1"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {committees.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No committees created yet</p>
          <button onClick={() => openModal()} className="btn-primary mt-4">
            Create your first committee
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="max-w-md mx-auto bg-white rounded-lg shadow-xl p-6 mt-20"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <h2 className="text-2xl font-bold mb-4">
          {editingCommittee ? 'Edit Committee' : 'Create New Committee'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Committee Name *</label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Start Date *</label>
              <input
                type="date"
                required
                className="input-field"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">End Date *</label>
              <input
                type="date"
                required
                className="input-field"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Total Amount (₹) *</label>
              <input
                type="number"
                required
                min="0"
                className="input-field"
                value={formData.totalAmount}
                onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Installment (₹) *</label>
              <input
                type="number"
                required
                min="0"
                className="input-field"
                value={formData.monthlyInstallment}
                onChange={(e) => setFormData({...formData, monthlyInstallment: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Total Members *</label>
              <input
                type="number"
                required
                min="1"
                className="input-field"
                value={formData.totalMembers}
                onChange={(e) => setFormData({...formData, totalMembers: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Late Fee per Day (₹)</label>
              <input
                type="number"
                min="0"
                className="input-field"
                value={formData.lateFeePerDay}
                onChange={(e) => setFormData({...formData, lateFeePerDay: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              {editingCommittee ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Committees;