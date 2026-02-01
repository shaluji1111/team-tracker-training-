import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { KPIBadge } from '../components/KPIBadge';
import { useAuth } from '../context/AuthContext';
import { addTrainer, resetPassword, getTeamPerformance, deleteUser, updateUser } from '../lib/api';
import { UserPlus, RefreshCw, AlertCircle, Trash2, Pencil } from 'lucide-react';
import './UserManagement.css';

export function UserManagement() {
    const { user } = useAuth();
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', jsId: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTrainer, setEditingTrainer] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', jsId: '' });

    const loadTrainers = async () => {
        const today = new Date();
        const offset = today.getTimezoneOffset();
        const localDate = new Date(today.getTime() - (offset * 60 * 1000));
        const todayStr = localDate.toISOString().split('T')[0];
        const result = await getTeamPerformance(todayStr);

        if (result.success) {
            setTrainers(result.trainers);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadTrainers();
        // Poll for updates
        const interval = setInterval(loadTrainers, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAddTrainer = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const result = await addTrainer(formData.name.trim(), formData.jsId.trim(), user.id);

        if (result.success) {
            setSuccess(`Trainer ${formData.name} added successfully!`);
            setFormData({ name: '', jsId: '' });
            setShowAddForm(false);
            loadTrainers();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error || 'Failed to add trainer');
        }
    };

    const handleResetPassword = async (trainerId, trainerName) => {
        if (!confirm(`Reset password for ${trainerName}? This will set their password to: Welcome@JS2026`)) {
            return;
        }

        const result = await resetPassword(trainerId, user.id);

        if (result.success) {
            setSuccess(`Password reset for ${trainerName}`);
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error || 'Failed to reset password');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleDeleteTrainer = async (trainerId, trainerName) => {
        if (!confirm(`Are you sure you want to delete trainer "${trainerName}"? This action cannot be undone.`)) {
            return;
        }

        const result = await deleteUser(trainerId, user.id);

        if (result.success) {
            setSuccess(`Trainer ${trainerName} deleted successfully`);
            loadTrainers();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error || 'Failed to delete trainer');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleEditClick = (trainer) => {
        setEditingTrainer(trainer);
        setEditFormData({ name: trainer.name, jsId: trainer.js_id });
        setEditModalOpen(true);
        setError('');
        setSuccess('');
    };

    const handleUpdateTrainer = async (e) => {
        e.preventDefault();
        setError('');

        if (!editingTrainer) return;

        const result = await updateUser(editingTrainer.id, editFormData.name.trim(), editFormData.jsId.trim(), user.id);

        if (result.success) {
            setSuccess(`Trainer ${editFormData.name} updated successfully!`);
            setEditModalOpen(false);
            setEditingTrainer(null);
            loadTrainers();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error || 'Failed to update trainer');
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="main-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">User Management</h1>
                        <p className="page-subtitle">Manage trainers and reset passwords</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                        <UserPlus size={20} />
                        Add Trainer
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error fade-in">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success fade-in">
                        <AlertCircle size={18} />
                        <span>{success}</span>
                    </div>
                )}

                {showAddForm && (
                    <div className="card add-trainer-form fade-in">
                        <h3 className="card-title">Add New Trainer</h3>
                        <form onSubmit={handleAddTrainer}>
                            <div className="form-row-inline">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., John Doe"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">JS ID</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.jsId}
                                        onChange={(e) => setFormData({ ...formData, jsId: e.target.value })}
                                        placeholder="e.g., JS12345"
                                        required
                                    />
                                </div>

                                <div className="form-group form-actions-inline">
                                    <button type="submit" className="btn btn-primary">
                                        Add Trainer
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowAddForm(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                        <p className="help-text">Default password: Welcome@JS2026</p>
                    </div>
                )}

                {editModalOpen && (
                    <div className="modal-overlay">
                        <div className="card add-trainer-form fade-in" style={{ maxWidth: '500px', margin: '2rem auto' }}>
                            <h3 className="card-title">Edit Trainer Details</h3>
                            <form onSubmit={handleUpdateTrainer}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">JS ID</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editFormData.jsId}
                                        onChange={(e) => setEditFormData({ ...editFormData, jsId: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button type="submit" className="btn btn-primary">Save Changes</button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setEditModalOpen(false);
                                            setEditingTrainer(null);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="card">
                    <h2 className="card-title">All Trainers</h2>
                    {loading ? (
                        <div className="loading-state">Loading trainers...</div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>JS ID</th>
                                        <th>Today's Hours</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trainers.map((trainer) => (
                                        <tr key={trainer.id}>
                                            <td>{trainer.name}</td>
                                            <td>{trainer.js_id}</td>
                                            <td>{trainer.hours.toFixed(1)} hrs</td>
                                            <td>
                                                <KPIBadge hours={trainer.hours} status={trainer.status} />
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleEditClick(trainer)}
                                                    title="Edit Details"
                                                    style={{ marginRight: '0.5rem' }}
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleResetPassword(trainer.id, trainer.name)}
                                                >
                                                    <RefreshCw size={16} />
                                                    Reset Password
                                                </button>
                                                <button
                                                    className="btn btn-icon-only btn-sm"
                                                    onClick={() => handleDeleteTrainer(trainer.id, trainer.name)}
                                                    title="Delete Trainer"
                                                    style={{ marginLeft: '0.5rem', color: 'var(--status-red)', border: '1px solid var(--border-color)', background: 'transparent' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
