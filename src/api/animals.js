import apiClient from './client';

export async function getAnimals() {
  const { data } = await apiClient.get('/animals');
  return data;
}

export async function createAnimal(payload, photo) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, String(value));
  });
  if (photo) formData.append('photo', photo);

  const { data } = await apiClient.post('/animals', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}