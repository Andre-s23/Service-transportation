import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function Plants() {
  const [items1, setItems1] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [sortOrder, setSortOrder] = useState('asc');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [formLoading, setFormLoading] = useState(false);


  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plants/', { params: { search } });
      setItems1(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [search]);


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
      name: '', region: '', address: '', phone: '', manager_name: '', workshop_count: 1
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
      if (isEditing) {
        await api.put(`/plants/${formData.id}`, formData);
      } else {
        await api.post('/plants/', formData);
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      alert('Ошибка сохранения: ' + (err.response?.data?.detail || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить завод?')) {
      try {
        await api.delete(`/plants/${id}`);
        setItems1(prev => prev.filter(i => i.id !== id));
      } catch (err) {
        alert('Не удалось удалить (возможно, есть связи).');
      }
    }
  };


  const isAdmin = user?.role === 'admin';

  return (
    <div className="container py-4">

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Заводы</h3>
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

          <input type="text" className="form-control" placeholder="Поиск по названию и региону..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '250px' }} />
          {isAdmin && <button className="btn btn-primary" onClick={handleOpenAdd}>+ Добавить завод</button>}
        </div>
      </div>


      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4">Название</th>
                <th>Регион</th>
                <th>Адрес</th>
                <th>Телефон</th>
                <th>Цехов</th>
                {isAdmin && <th className="text-end pe-4">Действия</th>}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className="ps-4 fw-medium">{item.name}</td>
                  <td>{item.region}</td>
                  <td>{item.address || '—'}</td>
                  <td>{item.phone || '—'}</td>
                  <td>{item.workshop_count || 0}</td>
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


      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isEditing ? 'Редактировать завод' : 'Новый завод'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className=" mb-3">
                    <input type="text" className="form-control" required
                      value={formData.name || ''}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Название завода (обязательно)" />
                  </div>
                  <div className="row g-3">
                    <div className="col-6">
                      <div >
                        <input type="text" className="form-control"
                          value={formData.region || ''}
                          onChange={e => setFormData({...formData, region: e.target.value})}
                          placeholder="Область" />
                      </div>
                    </div>
                    <div className="col-6">
                      <div >
                        <input type="number"  min="0"
                          value={formData.workshop_count || 0}
                          onChange={e => setFormData({...formData, workshop_count: Number(e.target.value)})}
                          placeholder="Кол-во цехов" />
                      </div>
                    </div>
                  </div>
                  <div className=" mt-3">
                    <input type="text" className="form-control"
                      value={formData.address || ''}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      placeholder="Адрес" />
                  </div>
                  <div className=" mt-3">
                    <input type="text" className="form-control"
                      value={formData.phone || ''}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="Телефон" />
                  </div>
                  <div className=" mt-3">
                    <input type="text" className="form-control"
                      value={formData.manager_name || ''}
                      onChange={e => setFormData({...formData, manager_name: e.target.value})}
                      placeholder="ФИО руководителя" />
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