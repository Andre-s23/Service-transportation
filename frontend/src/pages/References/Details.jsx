import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function Details() {
  const [items1, setItems1] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [sortOrder, setSortOrder] = useState('asc');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [formLoading, setFormLoading] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [detailsRes, warehousesRes] = await Promise.all([
          api.get('/details/', { params: { search } }),
          api.get('/warehouses/')
        ]);
        setItems1(detailsRes.data);
        setWarehouses(warehousesRes.data);
      } catch (err) {
        console.error('Ошибка загрузки:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [search]);


  const items = [...items1].sort((a, b) => {
    const nameA = a.name?.toLowerCase() || '';
    const nameB = b.name?.toLowerCase() || '';
    if (sortOrder === 'asc') {
      return nameA.localeCompare(nameB, 'ru');
    } else {
      return nameB.localeCompare(nameA, 'ru');
    }
  });


  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
    name: '', current_stock: 0, base_price: 0, min_stock: 0, is_fragile: false, warehouse_id: ''
    });
    setShowModal(true);
  };


  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setFormData({ ...item });
    setShowModal(true);
  };


  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = { ...formData, warehouse_id: Number(formData.warehouse_id) };
      if (isEditing) {
        await api.put(`/details/${formData.id}`, payload);
      } else {
        await api.post('/details/', payload);
      }
      setShowModal(false);
      const res = await api.get('/details/', { params: { search } });
      setItems1(res.data);
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.detail || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить деталь? Это действие нельзя отменить.')) {
      try {
        await api.delete(`/details/${id}`);
        setItems1(prev => prev.filter(i => i.id !== id));
      } catch (err) {
        alert('Не удалось удалить (возможно, деталь используется в перевозках).');
      }
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="container py-4">

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Детали</h3>
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


          <input type="text" className="form-control" placeholder="Поиск по названию..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ width: '250px' }} />
          {isAdmin && <button className="btn btn-primary" onClick={handleOpenAdd}>+ Добавить деталь</button>}
        </div>
      </div>


      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4">Название</th>
                <th>Базовая цена</th>
                <th>На складе</th>
                <th>Мин. остаток</th>
                <th>Хрупкая</th>
                <th>Склад хранения</th>
                {isAdmin && <th className="text-end pe-4">Действия</th>}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className="ps-4 fw-medium">{item.name}</td>
                  <td>{item.base_price?.toLocaleString()} ₽</td>
                  <td>{item.current_stock} шт.</td>
                  <td>{item.min_stock} шт.</td>
                  <td>{item.is_fragile ? ' Да' : ' Нет'}</td>
                  <td>{item.warehouse_name || '—'}</td>
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
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{isEditing ? 'Редактировать деталь' : 'Новая деталь'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Название *</label>
                    <input type="text" className="form-control" required
                      value={formData.name || ''}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Например: Подшипник 6205" />
                  </div>
                  <div className="mb-3">
  <label className="form-label">На складе (шт.) *</label>
  <input type="number" className="form-control" required min="0"
    value={formData.current_stock || 0}
    onChange={e => setFormData({...formData, current_stock: Number(e.target.value)})} />
</div>
                  <div className="mb-3">
                    <label className="form-label">Склад хранения *</label>
                    <select className="form-select" required
                      value={formData.warehouse_id || ''}
                      onChange={e => setFormData({...formData, warehouse_id: e.target.value})}>
                      <option value="">Выберите склад</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label">Базовая цена (₽)</label>
                      <input type="number" className="form-control" step="0.01" min="0"
                        value={formData.base_price || 0}
                        onChange={e => setFormData({...formData, base_price: Number(e.target.value)})} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Мин. остаток (шт)</label>
                      <input type="number" className="form-control" min="0"
                        value={formData.min_stock || 0}
                        onChange={e => setFormData({...formData, min_stock: Number(e.target.value)})} />
                    </div>
                  </div>

                  <div className="form-check mt-3">
                    <input type="checkbox" className="form-check-input" id="fragileCheck"
                      checked={formData.is_fragile || false}
                      onChange={e => setFormData({...formData, is_fragile: e.target.checked})} />
                    <label className="form-check-label" htmlFor="fragileCheck">
                      Хрупкая
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
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