// my-app/src/api/receipts.js
import api from './axios';

export const uploadReceiptImage = async (file) => {
  const fd = new FormData();
  fd.append('image', file);
  const { data } = await api.post('/receipts/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data; // { imageUrl }
};

export const parseReceiptText = async (text) => {
  const { data } = await api.post('/receipts/parse', { text });
  return data; // parsed fields
};

export const createReceipt = async ({ text, parsed, imageUrl, metodoTransporte }) => {
  const payload = { text, parsed, imageUrl };
  if (metodoTransporte) {
    payload.metodoTransporte = metodoTransporte;
  }
  const { data } = await api.post('/receipts', payload);
  return data;
};

export const listReceipts = async () => {
  const { data } = await api.get('/receipts');
  return data;
};
