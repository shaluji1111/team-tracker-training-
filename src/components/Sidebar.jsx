import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, FileText, Users, LogOut, Activity, Megaphone, List, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logoutUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const closeSidebar = () => {
        setIsOpen(false);
    };

    const isAdmin = user?.role === 'admin';

    return (
        <>
            {/* Mobile hamburger button */}
            <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle menu">
                <Menu size={24} />
            </button>

            {/* Overlay for mobile */}
            {isOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

            {/* Sidebar */}
            <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <Activity className="logo-icon" size={24} />
                        <span className="logo-text">Daily Drill</span>
                    </div>
                    <button className="close-btn" onClick={closeSidebar} aria-label="Close menu">
                        <X size={24} />
                    </button>
                </div>

                <div className="sidebar-content">
                    {/* User info */}
                    <div className="user-info">
                        <div className="user-section-title">MY DESK</div>
                        <div className="user-name">{user?.name}</div>
                        {!isAdmin && <div className="user-role">Trainer</div>}
                    </div>

                    {/* Navigation */}
                    <nav className="nav-menu">
                        {isAdmin ? (
                            <>
                                <NavLink to="/admin" end className="nav-link" onClick={closeSidebar}>
                                    <LayoutDashboard size={20} />
                                    <span>Dashboard</span>
                                </NavLink>
                                <NavLink to="/admin/reports" className="nav-link" onClick={closeSidebar}>
                                    <FileText size={20} />
                                    <span>Reports</span>
                                </NavLink>
                                <NavLink to="/admin/users" className="nav-link" onClick={closeSidebar}>
                                    <Users size={20} />
                                    <span>Manage Users</span>
                                </NavLink>
                                <NavLink to="/admin/announcements" className="nav-link" onClick={closeSidebar}>
                                    <Megaphone size={20} />
                                    <span>Announcements</span>
                                </NavLink>
                                <NavLink to="/admin/task-types" className="nav-link" onClick={closeSidebar}>
                                    <List size={20} />
                                    <span>Task Types</span>
                                </NavLink>
                                <NavLink to="/admin/logs" className="nav-link" onClick={closeSidebar}>
                                    <Shield size={20} />
                                    <span>Audit Logs</span>
                                </NavLink>
                            </>
                        ) : (
                            <>
                                <NavLink to="/dashboard" end className="nav-link" onClick={closeSidebar}>
                                    <LayoutDashboard size={20} />
                                    <span>Dashboard</span>
                                </NavLink>
                                <NavLink to="/tasks" className="nav-link" onClick={closeSidebar}>
                                    <FileText size={20} />
                                    <span>Task History</span>
                                </NavLink>
                            </>
                        )}
                    </nav>
                </div>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
