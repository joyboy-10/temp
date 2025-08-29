const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || './data';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILES = {
  institutions: path.join(DATA_DIR, 'institutions.json'),
  auditors: path.join(DATA_DIR, 'auditors.json'),
  associates: path.join(DATA_DIR, 'associates.json'),
  purposes: path.join(DATA_DIR, 'purposes.json'),
  transactions: path.join(DATA_DIR, 'transactions.json'),
  config: path.join(DATA_DIR, 'config.json')
};

// Initialize empty database structure
const EMPTY_DB = {
  institutions: {},
  auditors: {},
  associates: {},
  purposes: {},
  transactions: {},
  config: {
    theme: 'default',
    lastBackup: null
  }
};

// In-memory indices for fast lookups
let dbCache = null;
let indices = {
  institutionsByName: new Map(),
  associatesByInstitution: new Map(),
  purposesByInstitution: new Map(),
  transactionsByInstitution: new Map()
};

// Initialize database files if they don't exist
function initializeDB() {
  for (const [key, filepath] of Object.entries(DB_FILES)) {
    if (!fs.existsSync(filepath)) {
      const initialData = key === 'config' ? EMPTY_DB.config : {};
      fs.writeFileSync(filepath, JSON.stringify(initialData, null, 2));
    }
  }
}

// Atomic write operation
function atomicWrite(filepath, data) {
  const tempPath = filepath + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
  fs.renameSync(tempPath, filepath);
}

// Load all database files into memory
function loadDB() {
  const db = {};
  
  for (const [key, filepath] of Object.entries(DB_FILES)) {
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      db[key] = JSON.parse(content);
    } catch (error) {
      console.error(`Error loading ${key}:`, error.message);
      db[key] = key === 'config' ? EMPTY_DB.config : {};
    }
  }
  
  return db;
}

// Save database to files
function saveDB(db) {
  for (const [key, data] of Object.entries(db)) {
    if (DB_FILES[key]) {
      atomicWrite(DB_FILES[key], data);
    }
  }
}

// Build in-memory indices
function buildIndices(db) {
  indices.institutionsByName.clear();
  indices.associatesByInstitution.clear();
  indices.purposesByInstitution.clear();
  indices.transactionsByInstitution.clear();

  // Index institutions by name
  for (const [id, institution] of Object.entries(db.institutions)) {
    indices.institutionsByName.set(institution.name.toLowerCase(), id);
  }

  // Index associates by institution
  for (const [id, associate] of Object.entries(db.associates)) {
    if (!indices.associatesByInstitution.has(associate.institutionId)) {
      indices.associatesByInstitution.set(associate.institutionId, []);
    }
    indices.associatesByInstitution.get(associate.institutionId).push(id);
  }

  // Index purposes by institution
  for (const [id, purpose] of Object.entries(db.purposes)) {
    if (!indices.purposesByInstitution.has(purpose.institutionId)) {
      indices.purposesByInstitution.set(purpose.institutionId, []);
    }
    indices.purposesByInstitution.get(purpose.institutionId).push(id);
  }

  // Index transactions by institution
  for (const [id, transaction] of Object.entries(db.transactions)) {
    if (!indices.transactionsByInstitution.has(transaction.institutionId)) {
      indices.transactionsByInstitution.set(transaction.institutionId, []);
    }
    indices.transactionsByInstitution.get(transaction.institutionId).push(id);
  }
}

// Get cached database
function readDB() {
  if (!dbCache) {
    dbCache = loadDB();
    buildIndices(dbCache);
  }
  return dbCache;
}

// Write database and update cache
function writeDB(db) {
  saveDB(db);
  dbCache = db;
  buildIndices(dbCache);
}

// Verify database constraints
function verifyConstraints(db) {
  const errors = [];

  // Check institution uniqueness
  const institutionNames = new Set();
  for (const institution of Object.values(db.institutions)) {
    const nameLower = institution.name.toLowerCase();
    if (institutionNames.has(nameLower)) {
      errors.push(`Duplicate institution name: ${institution.name}`);
    }
    institutionNames.add(nameLower);
  }

  // Check associate limits
  const associateCounts = new Map();
  for (const associate of Object.values(db.associates)) {
    const count = associateCounts.get(associate.institutionId) || 0;
    associateCounts.set(associate.institutionId, count + 1);
  }

  for (const [institutionId, count] of associateCounts) {
    if (count > 2) {
      errors.push(`Institution ${institutionId} has ${count} associates (max 2)`);
    }
  }

  return errors;
}

// Initialize database on startup
function initializeDatabase() {
  try {
    initializeDB();
    const db = loadDB();
    const errors = verifyConstraints(db);
    
    if (errors.length > 0 && !process.env.OVERRIDE) {
      console.error('Database constraint violations:');
      errors.forEach(error => console.error(`  - ${error}`));
      console.error('Set OVERRIDE=1 to ignore constraints');
      process.exit(1);
    }
    
    dbCache = db;
    buildIndices(dbCache);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    process.exit(1);
  }
}

module.exports = {
  initializeDatabase,
  readDB,
  writeDB,
  indices
};