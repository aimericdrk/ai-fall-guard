import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/authSlice';
import { fetchUnreadCount } from '../../store/notificationSlice';
import './Layout.css';

const Layout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user } = useSelector((state: RootState) => state.auth);
    const { unreadCount } = useSelector((state: RootState) => state.notifications);

    useEffect(() => {
        if (user) {
            dispatch(fetchUnreadCount() as any);
        }
    }, [dispatch, user]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: '📊' },
        { name: 'Fall Events', href: '/fall-events', icon: '🚨' },
        { name: 'Notifications', href: '/notifications', icon: '🔔', badge: unreadCount > 0 ? unreadCount : undefined },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="layout-container">
            {/* Sidebar for mobile */}
            {sidebarOpen && (
                <div className="modal-overlay" onClick={() => setSidebarOpen(false)}>
                    <div className="sidebar" style={{ width: '250px', marginRight: 'auto' }} onClick={(e) => e.stopPropagation()}>
                        <div className="sidebar-header">
                            <button className="modal-close" onClick={() => setSidebarOpen(false)}>×</button>
                            <h1 className="sidebar-title">Fall Detection</h1>
                        </div>
                        <nav className="sidebar-nav">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    {item.name}
                                    {item.badge && <span className="nav-badge">{item.badge}</span>}
                                </Link>
                            ))}
                        </nav>
                        <div className="sidebar-footer">
                            <div className="user-info">
                                <div>
                                    <p className="user-name">{user?.firstName} {user?.lastName}</p>
                                    <p className="user-email">{user?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Static sidebar for desktop */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <h1 className="sidebar-title">Fall Detection</h1>
                </div>
                <nav className="sidebar-nav">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.name}
                            {item.badge && <span className="nav-badge">{item.badge}</span>}
                        </Link>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <div className="user-info">
                        <div>
                            <p className="user-name">{user?.firstName} {user?.lastName}</p>
                            <p className="user-email">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="main-content">
                <div className="mobile-header">
                    <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
                        ☰
                    </button>
                </div>

                <main className="content-area">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;