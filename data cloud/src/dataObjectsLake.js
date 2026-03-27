const fs = require('fs');
const path = require('path');

class DataObjectsLake {
  constructor(filePath) {
    this.filePath = filePath;
    this.state = {
      entities: {},
      metadata: {
        lastUpdatedAt: null,
        ingestedFiles: []
      }
    };
  }

  load() {
    if (!fs.existsSync(this.filePath)) {
      this.persist();
      return;
    }

    const raw = fs.readFileSync(this.filePath, 'utf8');
    if (!raw.trim()) {
      this.persist();
      return;
    }

    this.state = JSON.parse(raw);
  }


  resetForFullRebuild() {
    this.state = {
      entities: {},
      metadata: {
        lastUpdatedAt: null,
        ingestedFiles: []
      }
    };
  }
  ensureEntity(entityName) {
    if (!this.state.entities[entityName]) {
      this.state.entities[entityName] = [];
    }
  }

  upsert(entityName, record, options = {}) {
    this.ensureEntity(entityName);

    const collection = this.state.entities[entityName];
    const configuredPrimaryKey = options.primaryKey || null;
    const idKey = configuredPrimaryKey || (Object.prototype.hasOwnProperty.call(record, 'id') ? 'id' : null);

    if (!idKey || !Object.prototype.hasOwnProperty.call(record, idKey)) {
      collection.push(record);
      return;
    }

    const existingIndex = collection.findIndex((item) => String(item[idKey]) === String(record[idKey]));

    if (existingIndex >= 0) {
      collection[existingIndex] = {
        ...collection[existingIndex],
        ...record,
        updatedAt: new Date().toISOString()
      };
      return;
    }

    collection.push({
      ...record,
      createdAt: new Date().toISOString()
    });
  }

  markIngestion(fileName, streamName = null, entityName = null) {
    this.state.metadata.lastUpdatedAt = new Date().toISOString();
    this.state.metadata.ingestedFiles.push({
      fileName,
      streamName,
      entityName,
      ingestedAt: new Date().toISOString()
    });
  }

  getSummary() {
    const entityCounts = Object.fromEntries(
      Object.entries(this.state.entities).map(([entity, items]) => [entity, items.length])
    );

    return {
      entityCounts,
      metadata: this.state.metadata
    };
  }

  persist() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
  }
}

module.exports = DataObjectsLake;
