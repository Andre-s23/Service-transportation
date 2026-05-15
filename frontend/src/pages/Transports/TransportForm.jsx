// src/pages/Transports/TransportForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function TransportForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // Если есть ID в URL — значит, редактируем
  const { user } = useAuth();
  const isEdit = !!id;

  // Справочники
  const [plants, setPlants] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [details, setDetails] = useState([]);

  // Форма
  const [formData, setFormData] = useState({
    assign_date: new Date().toISOString().split('T')[0],
    completion_date: '',
    plant_id: '',
    vehicle_id: '',
    trailer_id: '',
    driver_id: '',
    details: []
  });

  // Новая позиция груза
  const [newDetail, setNewDetail] = useState({ detail_id: '', quantity: 1, shipping_cost: 0 });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Загрузка справочников
  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [p, v, t, d, det] = await Promise.all([
          api.get('/plants/'),
          api.get('/vehicles/?serviceable_only=true'),
          api.get('/trailers/?serviceable_only=true'),
          api.get('/employees/?role=driver'),
          api.get('/details/')
        ]);
        setPlants(p.data);
        setVehicles(v.data);
        setTrailers(t.data);
        setDrivers(d.data.filter(x => x.is_driver));
        setDetails(det.data);
      } catch (err) {
        setError('Не удалось загрузить справочники');
        console.error(err);
      }
    };
    loadRefs();
  }, []);

  // Загрузка данных для редактирования
  useEffect(() => {
    if (!isEdit) return;
    const loadTransport = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/transports/${id}`);
        const t = res.data;
        setFormData({
          assign_date: t.assign_date?.slice(0, 10) || '',
          completion_date: formData.completion_date || null,
          plant_id: t.plant_id || '',
          vehicle_id: t.vehicle_id || '',
          trailer_id: t.trailer_id || '',
          driver_id: t.driver_id || '',
          details: t.details || []
        });
      } catch (err) {
        setError('Не удалось загрузить перевозку');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTransport();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addDetailItem = () => {
    if (!newDetail.detail_id || newDetail.quantity < 1) {
      setError('Выберите деталь и укажите количество');
      return;
    }
    const detail = details.find(d => d.id === Number(newDetail.detail_id));
    if (!detail) return;

    setFormData(prev => ({
      ...prev,
      details: [...prev.details, {
        detail_id: Number(newDetail.detail_id),
        quantity: Number(newDetail.quantity),
        shipping_cost: Number(newDetail.shipping_cost) || 0,
        detail_name: detail.name,
        base_price: detail.base_price
      }]
    }));
    setNewDetail({ detail_id: '', quantity: 1, shipping_cost: 0 });
    setError('');
  };

  const removeDetailItem = (index) => {
    setFormData(prev => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.plant_id || !formData.vehicle_id || !formData.driver_id) {
      setError('Заполните: Завод, Автомобиль, Водитель');
      return;
    }
    if (formData.details.length === 0) {
      setError('Добавьте хотя бы одну позицию груза');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        completion_date: formData.completion_date || null,
        plant_id: Number(formData.plant_id),
        vehicle_id: Number(formData.vehicle_id),
        trailer_id: formData.trailer_id ? Number(formData.trailer_id) : null,
        driver_id: Number(formData.driver_id),
        details: formData.details.map(d => ({
          detail_id: d.detail_id,
          quantity: Number(d.quantity),
          shipping_cost: Number(d.shipping_cost) || 0
        }))
      };

      if (isEdit) {
        await api.put(`/transports/${id}`, payload);
        setSuccess('Перевозка обновлена!');
      } else {
        await api.post('/transports/', payload);
        setSuccess('Перевозка создана!');
      }

      setTimeout(() => navigate('/transports'), 1500);
    } catch (err) {
        if (err.response?.status === 409){
            setError(err.response?.data?.detail);
            }
        if (err.response?.status === 400){
            setError(err.response?.data?.detail);
            }
      setError(err.response?.data?.detail || 'Ошибка при сохранении');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && isEdit) {
    return <div className="container py-5 text-center">Загрузка...</div>;
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">{isEdit ? 'Редактирование перевозки' : 'Новая перевозка'}</h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate('/transports')}>
          ← Назад
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card shadow-sm border-0">
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Основные поля */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label">Дата назначения *</label>
              <input type="date" name="assign_date" className="form-control" value={formData.assign_date} onChange={handleChange} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Дата завершения</label>
              <input type="date" name="completion_date" className="form-control" value={formData.completion_date} onChange={handleChange} min={formData.assign_date} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Завод *</label>
              <select name="plant_id" className="form-select" value={formData.plant_id} onChange={handleChange} required>
                <option value="">Выберите завод</option>
                {plants.map(p => <option key={p.id} value={p.id}>{p.name} ({p.region})</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Автомобиль *</label>
              <select name="vehicle_id" className="form-select" value={formData.vehicle_id} onChange={handleChange} required>
                <option value="">Выберите автомобиль</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.license_plate} ({v.tonnage} т)</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Прицеп</label>
              <select name="trailer_id" className="form-select" value={formData.trailer_id} onChange={handleChange}>
                <option value="">Без прицепа</option>
                {trailers.map(t => <option key={t.id} value={t.id}>{t.brand} {t.license_plate} ({t.tonnage} т)</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Водитель *</label>
              <select name="driver_id" className="form-select" value={formData.driver_id} onChange={handleChange} required>
                <option value="">Выберите водителя</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name} {d.phone && `(${d.phone})`}</option>)}
              </select>
            </div>
          </div>

          <hr className="my-4" />

          {/* Грузы */}
          <h5 className="mb-3">Добавить груз</h5>
          <div className="row g-2 align-items-end mb-3">
            <div className="col-md-5">
              <label className="form-label small">Деталь</label>
              <select className="form-select" value={newDetail.detail_id} onChange={e => setNewDetail(prev => ({ ...prev, detail_id: e.target.value }))}>
                <option value="">Выберите деталь</option>
                {details.map(d => <option key={d.id} value={d.id}>{d.name} — {d.base_price} ₽</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small">Кол-во</label>
              <input type="number" className="form-control" min="1" value={newDetail.quantity} onChange={e => setNewDetail(prev => ({ ...prev, quantity: e.target.value }))} />
            </div>
            <div className="col-md-3">
              <label className="form-label small">Стоимость доставки (₽)</label>
              <input type="number" className="form-control" min="0" step="0.01" value={newDetail.shipping_cost} onChange={e => setNewDetail(prev => ({ ...prev, shipping_cost: e.target.value }))} />
            </div>
            <div className="col-md-2">
              <button type="button" className="btn btn-success w-100" onClick={addDetailItem}>+ Добавить</button>
            </div>
          </div>

          {formData.details.length > 0 && (
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead className="table-light">
                  <tr><th>Деталь</th><th>Кол-во</th><th>Цена</th><th>Доставка</th><th>Сумма</th><th></th></tr>
                </thead>
                <tbody>
                  {formData.details.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.detail_name || `ID: ${item.detail_id}`}</td>
                      <td>{item.quantity}</td>
                      <td>{item.base_price?.toLocaleString() || '0'} ₽</td>
                      <td>{item.shipping_cost?.toLocaleString() || '0'} ₽</td>
                      <td className="fw-bold">{(item.quantity * item.shipping_cost).toLocaleString()} ₽</td>
                      <td><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeDetailItem(idx)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td colSpan="4" className="text-end fw-bold">Итого:</td>
                    <td className="fw-bold text-success">
                      {formData.details.reduce((sum, d) => sum + (d.quantity * d.shipping_cost), 0).toLocaleString()} ₽
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Кнопки */}
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/transports')} disabled={submitting}>Отмена</button>
            <button type="submit" className="btn btn-primary px-4" disabled={submitting}>
              {submitting ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}