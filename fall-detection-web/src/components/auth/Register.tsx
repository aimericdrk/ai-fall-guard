import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register } from '../../store/authSlice';
import { RootState } from '../../store';
import { RegisterCredentials } from '../../types';
import './Register.css';

const Register: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading } = useSelector((state: RootState) => state.auth);

    const [credentials, setCredentials] = useState<RegisterCredentials>({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await dispatch(register(credentials) as any).unwrap();
            toast.success('Registration successful!');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error || 'Registration failed');
        }
    };

    return (
        <div className="register-container">
            <div className="register-box">
                <div className="register-header">
                    <div className="register-icon">
                        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h2 className="register-title">Fall Detection System</h2>
                    <p className="register-subtitle">Register to your dashboard</p>
                </div>

                <form className="register-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="form-input"
                            placeholder="Email address"
                            value={credentials.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            autoComplete="given-name"
                            required
                            className="form-input"
                            placeholder="First Name"
                            value={credentials.firstName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            autoComplete="family-name"
                            required
                            className="form-input"
                            placeholder="Last Name"
                            value={credentials.lastName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="text"
                            autoComplete="tel"
                            className="form-input"
                            placeholder="Phone Number"
                            value={credentials.phoneNumber}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="form-input"
                            placeholder="Password"
                            value={credentials.password}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading && (
                                <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            Register
                        </button>
                    </div>
                </form>
                <p className="register-link">
                    Already have an account?{' '}
                    <button className="link-button" onClick={() => navigate('/login')}>
                        Log in here
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Register;