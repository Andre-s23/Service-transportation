import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function Trailers() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/trailers/', { params: { search } });
        setItems(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [search]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({ brand: '', license_plate: '', tonnage: 0, volume: 0, release_date: '', is_serviceable: true });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setFormData({ ...item, release_date: item.release_date?.slice(0, 10) || '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = { ...formData, tonnage: Number(formData.tonnage), volume: Number(formData.volume) };
      if (isEditing) await api.put(`/trailers/${formData.id}`, payload);
      else await api.post('/trailers/', payload);
      setShowModal(false);
      setItems((await api.get('/trailers/', { params: { search } })).data);
    } catch (err) { alert('Ошибка: ' + (err.response?.data?.detail || err.message)); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить прицеп?')) {
      try {
        await api.delete(`/trailers/${id}`);
        setItems(prev => prev.filter(i => i.id !== id));
      } catch (err) { alert('Не удалось удалить.'); }
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Прицепы</h3>
        <div className="d-flex gap-2">
          <input type="text" className="form-control" placeholder="Поиск по марке или госномеру..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '300px' }} />
          {isAdmin && <button className="btn btn-primary" onClick={handleOpenAdd}>+ Добавить прицеп</button>}
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4">Марка</th>
                <th>Госномер</th>
                <th>Грузоподъёмность</th>
                <th>Объём кузова</th>
                <th>Дата выпуска</th>
                <th>Статус</th>
                {isAdmin && <th className="text-end pe-4">Действия</th>}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className="ps-4 fw-medium">{item.brand}</td>
                  <td>{item.license_plate}</td>
                  <td>{item.tonnage} т</td>
                  <td>{item.volume} м³</td>
                  <td>{item.release_date}</td>
                  <td>{item.is_serviceable ? 'Исправен' : 'На ремонте'}</td>
                  {isAdmin && (
                    <td className="text-end pe-4">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleOpenEdit(item)}>✏️</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}>🗑️</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{isEditing ? '✏️ Редактировать прицеп' : '➕ Новый прицеп'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Марка *</label>
                    <input type="text" className="form-control" required value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="Например: Schmitz, Krone, Тонар" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Госномер *</label>
                    <input type="text" className="form-control text-uppercase" required value={formData.license_plate || ''} onChange={e => setFormData({...formData, license_plate: e.target.value.toUpperCase()})} placeholder="Т123УФ77" />
                  </div>
                  <div className="row g-3">
                    <div className="col-4">
                      <label className="form-label">Тоннаж</label>
                      <input type="number" step="0.1" min="0" className="form-control" value={formData.tonnage || 0} onChange={e => setFormData({...formData, tonnage: e.target.value})} />
                    </div>
                    <div className="col-4">
                      <label className="form-label">Объём (м³)</label>
                      <input type="number" step="1" min="0" className="form-control" value={formData.volume || 0} onChange={e => setFormData({...formData, volume: e.target.value})} />
                    </div>
                    <div className="col-4">
                      <label className="form-label">Дата выпуска</label>
                      <input type="date" className="form-control" value={formData.release_date || ''} onChange={e => setFormData({...formData, release_date: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-check mt-3">
                    <input type="checkbox" className="form-check-input" id="trailerServiceableCheck" checked={formData.is_serviceable || false} onChange={e => setFormData({...formData, is_serviceable: e.target.checked})} />
                    <label className="form-check-label" htmlFor="trailerServiceableCheck">Исправен</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
                  <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}