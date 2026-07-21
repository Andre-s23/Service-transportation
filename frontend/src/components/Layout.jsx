import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import api from '../api/axios';


export default function Layout() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const openProfile = () => {
      if (!user) {
    alert('Ошибка: данные пользователя не загружены');
    return;
  }

    setProfileForm({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      birth_date: user?.birth_date || '',
      hire_date: user?.hire_date || '',
      old_password: '',
      new_password: '',
      confirm_password: ''
    });
    setShowProfileModal(true);
  };
  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    try {

    if (profileForm.new_password) {
      if (profileForm.new_password !== profileForm.confirm_password) {
        throw new Error('Новые пароли не совпадают');
      }
      if (!profileForm.old_password) {
        throw new Error('Введите текущий пароль');
      }
    }

    const payload = {};

    if (profileForm.full_name?.trim()) {
      payload.full_name = profileForm.full_name.trim();
    }
    if (profileForm.phone?.trim()) {
      payload.phone = profileForm.phone.trim();
    }

    if (profileForm.birth_date) {
      payload.birth_date = String(profileForm.birth_date).slice(0, 10);
    } else {
      payload.birth_date = null;
    }

    if (profileForm.license_number !== undefined) {
      payload.license_number = profileForm.license_number || null;
    }
    if (profileForm.driving_experience !== undefined) {
      payload.driving_experience = profileForm.driving_experience
        ? Number(profileForm.driving_experience)
        : null;
    }


    if (profileForm.new_password) {
      payload.old_password = profileForm.old_password;
      payload.new_password = profileForm.new_password;
    }


    await api.put(`/employees/${user.id}`, payload);


    if (setUser) {
      setUser(prev => ({
        ...prev,
        full_name: payload.full_name || prev.full_name,
        phone: payload.phone || prev.phone,
        birth_date: payload.birth_date || prev.birth_date
      }));
    }

    setShowProfileModal(false);
    alert('Профиль обновлен');

  } catch (err) {

    const detail = err.response?.data?.detail;
    const errorMsg = detail
      ? (Array.isArray(detail)
          ? detail.map(d => `${d.loc?.join('.')}: ${d.msg}`).join('; ')
          : JSON.stringify(detail))
      : err.message || 'Ошибка при сохранении';

    alert('Ошибка: ' + errorMsg);
    console.error('Full error:', err);
  } finally {
    setProfileLoading(false);
  }
  };



  const getMenuItems = () => {
    const items = [
      { label: 'Главная', path: '/dashboard' }
    ];

    if (['admin', 'manager'].includes(user?.role)) {
      items.push(
        { label: 'Перевозки', path: '/transports' },
        { label: 'Детали', path: '/details' },
        { label: 'Заводы', path: '/plants' },
        { label: 'Склады', path: '/warehouses' },
        { label: 'Авто', path: '/vehicles' },
        { label: 'Прицепы', path: '/trailers' },

      );
    }

    if (user?.role === 'admin') {
        items.push({ label: 'Отчёты', path: '/reports' });
        items.push({ label: 'Сотрудники', path: '/employees' });
    }

    if (user?.role === 'driver') {
      items.push({ label: 'Мои рейсы', path: '/transports' });
      items.push({ label: 'Заводы', path: '/plants' });
      items.push({ label: 'Склады', path: '/warehouses' })
    }

    return items;
  };

  const menuItems = getMenuItems();

  return (
    <div className="d-flex flex-column min-vh-100">

      <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
        <div className="container-fluid">

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>


          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {menuItems.map((item) => (
                <li className="nav-item" key={item.path}>
                  <Link className="nav-link" to={item.path}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>


            <div className="d-flex align-items-center gap-3">
              <span
                className="text-muted fw-medium"
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={openProfile}
                title="Нажмите для редактирования профиля"
              >
                {user?.full_name || user?.login} ({user?.role})
              </span>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={handleLogout}>
                 Выйти
              </button>
            </div>
          </div>
        </div>
      </nav>


      <main className="flex-grow-1 p-3">
        <Outlet />
      </main>


      <footer className="bg-light text-center text-muted py-3 mt-auto">
        <div className="container">
          <small>© 2026 Система учета автоперевозок</small>
        </div>
      </footer>
      {showProfileModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Редактирование профиля</h5>
                <button type="button" className="btn-close" onClick={() => setShowProfileModal(false)}></button>
              </div>

              <form onSubmit={saveProfile}>
                <div className="modal-body">

                  <div className="mb-3">
                    <label className="form-label">ФИО</label>
                    <input type="text" className="form-control" required
                      value={profileForm.full_name}
                      onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Телефон</label>
                    <input type="text" className="form-control"
                      value={profileForm.phone}
                      onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                  </div>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label">Дата рождения</label>
                      <input type="date" className="form-control"
                        value={profileForm.birth_date || ''}
                        onChange={e => setProfileForm({...profileForm, birth_date: e.target.value})} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Дата найма</label>
                      <input
                        type="date"
                        className="form-control bg-light"
                        value={profileForm.hire_date || ''}
                        readOnly
                        title="Дату найма изменить нельзя"
                      />
                    </div>
                  </div>

                  <hr className="my-4" />
                  <h6 className="mb-3">Смена пароля</h6>
                  <small className="text-muted d-block mb-2">Оставьте поля пустыми, если не хотите менять пароль</small>

                  <div className="mb-2">
                    <label className="form-label">Текущий пароль</label>
                    <input type="password" className="form-control"
                      value={profileForm.old_password}
                      onChange={e => setProfileForm({...profileForm, old_password: e.target.value})} />
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label">Новый пароль</label>
                      <input type="password" className="form-control"
                        value={profileForm.new_password}
                        onChange={e => setProfileForm({...profileForm, new_password: e.target.value})} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Повторите</label>
                      <input type="password" className="form-control"
                        value={profileForm.confirm_password}
                        onChange={e => setProfileForm({...profileForm, confirm_password: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>Отмена</button>
                  <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                    {profileLoading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}