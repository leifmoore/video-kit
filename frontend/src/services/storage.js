const DB_NAME = 'video-kit';
const DB_VERSION = 1;
const STORES = {
  images: 'images',
  jobs: 'jobs',
};

const openDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.images)) {
        db.createObjectStore(STORES.images, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.jobs)) {
        db.createObjectStore(STORES.jobs, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const requestToPromise = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const runRequest = async (storeName, mode, operation) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = operation(store);
    requestToPromise(request).then(resolve).catch(reject);
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
};

export const getImages = async () => {
  const images = await runRequest(STORES.images, 'readonly', (store) => store.getAll());
  return images || [];
};

export const saveImage = async (image) =>
  runRequest(STORES.images, 'readwrite', (store) => store.put(image));

export const deleteImage = async (id) =>
  runRequest(STORES.images, 'readwrite', (store) => store.delete(id));

export const clearImages = async () =>
  runRequest(STORES.images, 'readwrite', (store) => store.clear());

export const getJobs = async () => {
  const jobs = await runRequest(STORES.jobs, 'readonly', (store) => store.getAll());
  return jobs || [];
};

export const saveJob = async (job) =>
  runRequest(STORES.jobs, 'readwrite', (store) => store.put(job));

export const deleteJob = async (id) =>
  runRequest(STORES.jobs, 'readwrite', (store) => store.delete(id));

export const clearJobs = async () =>
  runRequest(STORES.jobs, 'readwrite', (store) => store.clear());

export const clearAllData = async () => {
  await clearImages();
  await clearJobs();
};
