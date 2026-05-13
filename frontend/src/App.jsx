import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TransportList from './pages/Transports/TransportList';
import Reports from './pages/Reports';
import Layout from './components/Layout';
import TransportForm from './pages/Transports/TransportForm';
import Plants from './pages/References/Plants';
import Details from './pages/References/Details'
import Warehouses from './pages/References/Warehouses';
import Vehicles from './pages/References/Vehicles';
import Trailers from './pages/References/Trailers';
import Employees from './pages/Employees';
import { AuthProvider, useAuth } from './context/AuthContext';

// Компонент защиты роута (нужен ли он вам, решим позже, пока упростим)
function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center py-5">Загрузка...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Публичный вход */}
          <Route path="/login" element={<Login />} />

          {/* Layout с навбаром для всех защищённых страниц */}
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <PrivateRoute><Dashboard /></PrivateRoute>
            } />
            <Route path="/transports" element={
              <PrivateRoute allowedRoles={['admin', 'manager', 'client', 'driver']}>
                <TransportList />
              </PrivateRoute>
            } />
            <Route path="/reports" element={
              <PrivateRoute allowedRoles={['admin', 'manager']}>
                <Reports />
              </PrivateRoute>
            } />
            <Route path="/transports/new" element={
              <PrivateRoute allowedRoles={['admin', 'manager']}>
                <TransportForm />
              </PrivateRoute>
            } />
            <Route path="/transports/new" element={
              <PrivateRoute allowedRoles={['admin', 'manager']}>
                <TransportForm />
              </PrivateRoute>
            } />
            <Route path="/transports/:id/edit" element={
              <PrivateRoute allowedRoles={['admin', 'manager']}>
                <TransportForm />
              </PrivateRoute>
            } />
            {/* Добавьте сюда другие роуты по аналогии */}
            <Route path="/plants" element={<PrivateRoute allowedRoles={['admin', 'manager']}><Plants /></PrivateRoute>} />
            <Route path="/details" element={
              <PrivateRoute allowedRoles={['admin', 'manager']}>
                <Details />
              </PrivateRoute>
            } />
            <Route path="/warehouses" element={
              <PrivateRoute allowedRoles={['admin', 'manager']}>
                <Warehouses />
              </PrivateRoute>
            } />
            <Route path="/vehicles" element={
              <PrivateRoute allowedRoles={['admin', 'manager']}>
                <Vehicles />
              </PrivateRoute>
            } />
            <Route path="/trailers" element={
              <PrivateRoute allowedRoles={['admin', 'manager']}>
                <Trailers />
              </PrivateRoute>
            } />
            <Route path="/employees" element={
              <PrivateRoute allowedRoles={['admin']}>
                <Employees />
              </PrivateRoute>
            } />


          </Route>

          {/* 404 */}
          <Route path="*" element={<div className="text-center py-5">404 — Страница не найдена</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
