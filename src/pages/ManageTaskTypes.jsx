import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { getTaskTypes, addTaskType, updateTaskType, deleteTaskType } from '../lib/api';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import './AdminDashboard.css'; // Reusing admin styles

export function ManageTaskTypes() {
    const { user } = useAuth();
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newType, setNewType] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        setLoading(true);
        const result = await getTaskTypes();
        if (result.success) {
            setTypes(result.types);
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newType.trim()) return;

        const result = await addTaskType(newType.trim(), user.id);
        if (result.success) {
            setNewType('');
            setIsAdding(false);
            loadTypes();
        } else {
            alert(result.error);
        }
    };

    const handleUpdate = async (id) => {
        if (!editName.trim()) return;

        const result = await updateTaskType(id, editName.trim(), user.id);
        if (result.success) {
            setEditingId(null);
            loadTypes();
        } else {
            alert(result.error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this task type? This will NOT delete existing tasks of this type, but they will just be strings in the DB.')) return;

        const result = await deleteTaskType(id, user.id);
        if (result.success) {
            loadTypes();
        } else {
            alert(result.error);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1 className="page-title">Manage Task Types</h1>
                </div>

                <div className="card">
                    <div className="flex-between mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 className="card-title">Task Types List</h2>
                        <button className="btn btn-primary" onClick={() => setIsAdding(true)} disabled={isAdding}>
                            <Plus size={16} /> Add Type
                        </button>
                    </div>

                    {isAdding && (
                        <div className="mb-4 p-4 border rounded" style={{ marginBottom: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                            <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value)}
                                    placeholder="Enter new task type"
                                    autoFocus
                                />
                                <button type="submit" className="btn btn-primary">Save</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)}>Cancel</button>
                            </form>
                        </div>
                    )}

                    {loading ? (
                        <p>Loading...</p>
                    ) : error ? (
                        <p className="error-text">{error}</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th style={{ width: '150px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {types.map((type) => (
                                        <tr key={type.id}>
                                            <td>
                                                {editingId === type.id ? (
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                    />
                                                ) : (
                                                    type.name
                                                )}
                                            </td>
                                            <td>
                                                {editingId === type.id ? (
                                                    <div className="flex gap-2" style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            className="btn-icon btn-save"
                                                            onClick={() => handleUpdate(type.id)}
                                                            title="Save"
                                                        >
                                                            <Save size={16} />
                                                        </button>
                                                        <button
                                                            className="btn-icon btn-cancel"
                                                            onClick={() => setEditingId(null)}
                                                            title="Cancel"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2" style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            className="btn-icon btn-edit"
                                                            onClick={() => {
                                                                setEditingId(type.id);
                                                                setEditName(type.name);
                                                            }}
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            className="btn-icon btn-delete"
                                                            onClick={() => handleDelete(type.id)}
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
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
