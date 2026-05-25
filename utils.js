// Helper function to format seconds (e.g., 72 -> 1:12)
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function downloadWithLink(dataURL, filename = "output.json"){
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataURL);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function readFileAsDataURL(file){
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

function readFileAsText(file){
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsText(file);
    });
}


const LocalDB = {
  dbName: "CachedDataDB",
  storeName: "keyValueStore",
  version: 1,
  db: null,

  // Internal helper to open the database
  _getDB() {
    return new Promise((resolve, reject) => {
        if (this.db) {
            return resolve(this.db);
}
      const request = indexedDB.open(this.dbName, this.version);

      // Setup the database structure if it doesn't exist yet
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  },

  // Save data (Like localStorage.setItem)
  async setItem(key, value) {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  },

  // Retrieve data (Like localStorage.getItem)
  async getItem(key) {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  },

  // Delete data (Like localStorage.removeItem)
  async removeItem(key) {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }
};