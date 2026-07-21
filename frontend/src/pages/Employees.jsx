import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Employees() {
  const [items1, setItems1] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [sortOrder, setSortOrder] = useState('asc');
  const [roleFilter, setRoleFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [formLoading, setFormLoading] = useState(false);


  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/employees/', { params: { search } });
        setItems1(res.data);
      } catch (err) {
        console.error('Ошибка загрузки сотрудников:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [search]);

  const items2 = [...items1].sort((a, b) => {
    const nameA = a.full_name?.toLowerCase() || '';
    const nameB = b.full_name?.toLowerCase() || '';
    if (sortOrder === 'asc') {
      return nameA.localeCompare(nameB, 'ru');
    } else {
      return nameB.localeCompare(nameA, 'ru');
    }
  });

  const items = items2
    .filter(item => {
      if (roleFilter === 'all') return true;
      return item.role === roleFilter;
    })


  const handleOpenAdd = () => {
    setFormData({
      full_name: '',
      role: 'manager',
      phone: '',
      birth_date: '',
      hire_date: new Date().toISOString().split('T')[0],
      license_number: '',
      driving_experience: 0
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const now = new Date();
      const suffix = `${now.getDate()}${now.getMonth() + 1}`;
      const tempLogin = formData.full_name
        .toLowerCase()
        .replace(/[^a-zа-яё0-9]/gi, '')
        .slice(0, 4) + suffix;

      const payload = {
        ...formData,
        login: tempLogin,
        password: 'temp123!',
        birth_date: formData.birth_date || null,
        hire_date: formData.hire_date || null,
        ...(formData.role === 'driver'
          ? { license_number: formData.license_number, driving_experience: Number(formData.driving_experience) || 0 }
          : {})
      };

      await api.post('/employees/', payload);
      setShowModal(false);
      const res = await api.get('/employees/', { params: { search } });
      setItems1(res.data);
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.detail || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить сотрудника? Это действие нельзя отменить.')) {
      try {
        await api.delete(`/employees/${id}`);
        setItems1(prev => prev.filter(i => i.id !== id));
      } catch (err) {
        alert('Не удалось удалить (возможно, сотрудник назначен на рейс).');
      }
    }
  };


   const roleCounts = {
    all: items1.length,
    admin: items1.filter(i => i.role === 'admin').length,
    manager: items1.filter(i => i.role === 'manager').length,
    driver: items1.filter(i => i.role === 'driver').length,
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Сотрудники</h3>
        <div className="d-flex gap-2">


            <select
            className="form-select"
            style={{ maxWidth: '108px' }}
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
          >
            <option value="asc">А → Я</option>
            <option value="desc">Я → А</option>
          </select>


            <select
            className="form-select"
            style={{ maxWidth: '200px' }}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="all"> Все роли ({roleCounts.all})</option>
            <option value="admin"> Админы ({roleCounts.admin})</option>
            <option value="manager">Менеджеры ({roleCounts.manager})</option>
            <option value="driver">Водители ({roleCounts.driver})</option>
          </select>



          <input type="text" className="form-control" placeholder="Поиск по ФИО..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '300px' }} />
          <button className="btn btn-primary" onClick={handleOpenAdd}>Зарегистрировать</button>
        </div>
      </div>

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

      {showModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Регистрация сотрудника</h5>
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
                      value={formData.role || 'manager'}
                      onChange={e => setFormData({...formData, role: e.target.value})}>
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