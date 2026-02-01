import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../lib/api';
import { Lock, AlertCircle } from 'lucide-react';
import './ChangePassword.css';

export function ChangePassword({ onPasswordChanged }) {
    const { user } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        const result = await changePassword(user.id, newPassword);

        if (result.success) {
            onPasswordChanged();
        } else {
            setError(result.error || 'Failed to change password');
        }
        setLoading(false);
    };

    return (
        <div className="password-change-overlay">
            <div className="password-change-modal card">
                <div className="modal-icon">
                    <Lock size={48} style={{ color: 'var(--accent-green)' }} />
                </div>

                <h2 className="modal-title">Change Your Password</h2>
                <p className="modal-subtitle">
                    For security reasons, you must change your password before continuing.
                </p>

                <form onSubmit={handleSubmit} className="password-form">
                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            minLength={8}
                        />
                        <p className="form-hint">Minimum 8 characters</p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            minLength={8}
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Changing Password...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
