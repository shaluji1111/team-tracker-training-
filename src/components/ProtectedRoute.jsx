import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, requireAdmin = false }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh'
            }}>
                <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.must_change_password && location.pathname !== '/change-password') {
        return <Navigate to="/change-password" replace />;
    }

    if (requireAdmin && user.role !== 'admin') {
        // Trainers trying to access admin routes get redirected to their dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
