import client from './client'

export const trashApi = {
  getTrash: (page = 1, per_page = 24) =>
    client.get('/trash', { params: { page, per_page } }),

  emptyTrash: () =>
    client.delete('/trash/empty'),

  autoCleanup: () =>
    client.post('/trash/auto-cleanup'),
}