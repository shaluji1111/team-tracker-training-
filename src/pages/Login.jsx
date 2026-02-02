import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { login } from '../lib/api';
import './Login.css';

export function Login() {
    const [jsId, setJsId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(jsId.trim(), password);

            if (result.success) {
                loginUser(result.user);
                // Redirect based on role
                if (result.user.must_change_password) {
                    navigate('/change-password');
                } else if (result.user.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(result.error || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <Activity className="login-logo-icon" size={32} />
                        <h1 className="login-title">Daily Drill</h1>
                    </div>
                    <p className="login-subtitle">Sign in to your account</p>
                </div>

                {error && (
                    <div className="error-message">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="jsId" className="form-label">
                            JS ID / Username
                        </label>
                        <input
                            id="jsId"
                            type="text"
                            className="form-input"
                            value={jsId}
                            onChange={(e) => setJsId(e.target.value)}
                            placeholder="Enter your JS ID"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>


            </div>
        </div>
    );
}
