import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Employees() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  // Загрузка списка
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/employees/', { params: { search } });
        setItems(res.data);
      } catch (err) {
        console.error('Ошибка загрузки сотрудников:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [search]);

  // Открытие формы
  const handleOpenAdd = () => {
    setFormData({
      full_name: '',
      role: 'client',
      phone: '',
      birth_date: '',
      hire_date: new Date().toISOString().split('T')[0],
      license_number: '',
      driving_experience: 0
    });
    setShowModal(true);
  };

  // Сохранение сотрудника
  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      // 🔥 Автогенерация логина/пароля (чтобы не показывать их в UI)
      // В продакшене лучше генерировать на бэкенде, но для курсовой так проще
      const tempLogin = formData.full_name.toLowerCase()
        .replace(/[^a-zа-яё0-9]/gi, '')
        .slice(0, 10) || `user${Date.now().toString().slice(-4)}`;

      const payload = {
        ...formData,
        login: tempLogin,
        password: 'temp123!', // Пароль сбрасывается при первом входе или задаётся админом отдельно
        birth_date: formData.birth_date || null,
        hire_date: formData.hire_date || null,
        // Если не водитель — убираем поля ВУ, чтобы не ломать схему
        ...(formData.role === 'driver'
          ? { license_number: formData.license_number, driving_experience: Number(formData.driving_experience) || 0 }
          : {})
      };

      await api.post('/employees/', payload);
      setShowModal(false);
      // Обновляем список
      const res = await api.get('/employees/', { params: { search } });
      setItems(res.data);
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.detail || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  // Удаление
  const handleDelete = async (id) => {
    if (window.confirm('Удалить сотрудника? Это действие нельзя отменить.')) {
      try {
        await api.delete(`/employees/${id}`);
        setItems(prev => prev.filter(i => i.id !== id));
      } catch (err) {
        alert('Не удалось удалить (возможно, сотрудник назначен на рейс).');
      }
    }
  };

  // Перевод ролей на русский
  const getRoleLabel = (role) => {
    const map = { admin: 'Администратор', manager: 'Менеджер', client: 'Заказчик', driver: 'Водитель' };
    return map[role] || role;
  };

  return (
    <div className="container py-4">
      {/* Шапка */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Сотрудники</h3>
        <div className="d-flex gap-2">
          <input type="text" className="form-control" placeholder="Поиск по ФИО..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '300px' }} />
          <button className="btn btn-primary" onClick={handleOpenAdd}>Зарегистрировать</button>
        </div>
      </div>

      {/* Таблица */}
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4">ФИО</th>
                <th>Роль</th>
                <th>Телефон</th>
                <th>Водительское удостоверение</th>
                <th>День рождения</th>
                <th>Дата найма</th>
                <th className="text-end pe-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const licenseInfo = item.driver_profile?.license_number
                  ? `${item.driver_profile.license_number}`
                  : '—';

                return (
                  <tr key={item.id}>
                    <td>{item.full_name}</td>
                    <td>{item.role}</td>
                    <td>{item.phone || '—'}</td>
                    <td>{item.role === 'driver' ? licenseInfo : 'Не требуется'}</td>
                    <td>{item.birth_date || '—'}</td>
                    <td>{item.hire_date || '—'}</td>
                    <td className="text-end pe-4">
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}>
                         Удалить
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно регистрации */}
      {showModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">➕ Регистрация сотрудника</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">ФИО *</label>
                    <input type="text" className="form-control" required
                      value={formData.full_name || ''}
                      onChange={e => setFormData({...formData, full_name: e.target.value})}
                      placeholder="Иванов Иван Иванович" />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Роль в системе *</label>
                    <select className="form-select" required
                      value={formData.role || 'client'}
                      onChange={e => setFormData({...formData, role: e.target.value})}>
                      <option value="client">Заказчик</option>
                      <option value="manager">Менеджер</option>
                      <option value="driver">Водитель</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </div>

                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label">Телефон</label>
                      <input type="text" className="form-control"
                        value={formData.phone || ''}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        placeholder="+7..." />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Дата найма</label>
                      <input type="date" className="form-control"
                        value={formData.hire_date || ''}
                        onChange={e => setFormData({...formData, hire_date: e.target.value})} />
                    </div>
                  </div>

                  {/* 🔥 Поля появляются только если выбран Водитель */}
                  {formData.role === 'driver' && (
                    <div className="card bg-light mt-3 p-3">
                      <h6 className="mb-2"> Данные водителя</h6>
                      <div className="row g-3">
                        <div className="col-7">
                          <label className="form-label">Номер ВУ *</label>
                          <input type="text" className="form-control text-uppercase" required
                            value={formData.license_number || ''}
                            onChange={e => setFormData({...formData, license_number: e.target.value})}
                            placeholder="99АА123456" />
                        </div>
                        <div className="col-5">
                          <label className="form-label">Стаж (лет)</label>
                          <input type="number" className="form-control" min="0"
                            value={formData.driving_experience || 0}
                            onChange={e => setFormData({...formData, driving_experience: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
                  <button type="submit" className="btn btn-primary" disabled={formLoading}>
                    {formLoading ? 'Регистрация...' : 'Зарегистрировать'}
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