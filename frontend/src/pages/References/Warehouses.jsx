import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function Warehouses() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Состояния модального окна
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  // Загрузка данных
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const res = await api.get('/warehouses/', { params: { search } });
        setItems(res.data);
      } catch (err) {
        console.error('Ошибка загрузки складов:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [search]);

  // Открытие формы "Добавить"
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      region: '',
      address: '',
      phone: '',
      manager_name: ''
    });
    setShowModal(true);
  };

  // Открытие формы "Редактировать"
  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setFormData({ ...item });
    setShowModal(true);
  };

  // Сохранение (Создание или Обновление)
  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (isEditing) {
        await api.put(`/warehouses/${formData.id}`, formData);
      } else {
        await api.post('/warehouses/', formData);
      }
      setShowModal(false);
      // Обновляем список
      const res = await api.get('/warehouses/', { params: { search } });
      setItems(res.data);
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.detail || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  // Удаление
  const handleDelete = async (id) => {
    if (window.confirm('Удалить склад?')) {
      try {
        await api.delete(`/warehouses/${id}`);
        setItems(prev => prev.filter(i => i.id !== id));
      } catch (err) {
        alert('Не удалось удалить (возможно, склад используется).');
      }
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="container py-4">
      {/* Шапка */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Склады</h3>
        <div className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Поиск по названию или региону..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
          {isAdmin && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              + Добавить склад
            </button>
          )}
        </div>
      </div>

      {/* Таблица */}
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4">Название</th>
                <th>Регион</th>
                <th>Адрес</th>
                <th>Телефон</th>
                <th>Зав. складом</th>
                {isAdmin && <th className="text-end pe-4">Действия</th>}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className="ps-4 fw-medium">{item.name}</td>
                  <td>{item.region}</td>
                  <td><small className="text-muted">{item.address || '—'}</small></td>
                  <td>{item.phone || '—'}</td>
                  <td>{item.manager_name || '—'}</td>
                  {isAdmin && (
                    <td className="text-end pe-4">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleOpenEdit(item)}>
                        ✏️
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}>
                        🗑️
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно (Форма) */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isEditing ? '✏️ Редактировать склад' : '➕ Новый склад'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Название *</label>
                    <input type="text" className="form-control" required
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Название склада" />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Регион (Область)</label>
                    <input type="text" className="form-control"
                      value={formData.region || ''}
                      onChange={e => setFormData({ ...formData, region: e.target.value })}
                      placeholder="Например: Московская область" />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Адрес</label>
                    <input type="text" className="form-control"
                      value={formData.address || ''}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Адрес склада" />
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Телефон</label>
                        <input type="text" className="form-control"
                          value={formData.phone || ''}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+7..." />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Заведующий</label>
                        <input type="text" className="form-control"
                          value={formData.manager_name || ''}
                          onChange={e => setFormData({ ...formData, manager_name: e.target.value })}
                          placeholder="ФИО" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Отмена
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={formLoading}>
                    {formLoading ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать')}
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