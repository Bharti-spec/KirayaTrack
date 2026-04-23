const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// In-memory database (for demo - replace with real database)
let db = {
  landlords: [],
  tenants: [],
  buildings: [],
  rooms: [],
  payments: [],
  bills: []
};

// Load data from file if exists
async function loadData() {
  try {
    const data = await fs.readFile('database.json', 'utf8');
    db = JSON.parse(data);
  } catch (err) {
    console.log('No existing database, starting fresh');
  }
}

// Save data to file
async function saveData() {
  try {
    await fs.writeFile('database.json', JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error saving data:', err);
  }
}

// API Routes
app.get('/api/:table', async (req, res) => {
  try {
    let data = [...db[req.params.table] || []];

    // Handle select
    if (req.query.select && req.query.select !== '*') {
      const fields = req.query.select.split(',');
      data = data.map(item => {
        const result = {};
        fields.forEach(field => {
          if (field.includes('(')) {
            // Handle joins like buildings(name)
            const [table, column] = field.replace(')', '').split('(');
            if (table === 'buildings' && column === 'name') {
              const building = db.buildings.find(b => b.id === item.building_id);
              result.buildings = { name: building?.name || null };
            }
          } else {
            result[field] = item[field];
          }
        });
        return result;
      });
    }

    // Handle filters
    Object.keys(req.query).forEach(key => {
      if (key.startsWith('eq.')) {
        const field = key.replace('eq.', '');
        const value = req.query[key];
        data = data.filter(item => item[field] == value);
      }
    });

    // Handle order
    if (req.query.order) {
      const [field, direction] = req.query.order.split('.');
      data.sort((a, b) => {
        if (direction === 'desc') {
          return b[field] > a[field] ? 1 : -1;
        }
        return a[field] > b[field] ? 1 : -1;
      });
    }

    res.json({ data, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

app.post('/api/:table', async (req, res) => {
  try {
    const table = req.params.table;
    const item = { ...req.body, id: Date.now().toString(), created_at: new Date().toISOString() };

    if (!db[table]) db[table] = [];
    db[table].push(item);

    await saveData();
    res.json({ data: item, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

app.patch('/api/:table', async (req, res) => {
  try {
    const table = req.params.table;
    const updates = req.body;

    // Find records to update
    let updatedItems = [];
    Object.keys(req.query).forEach(key => {
      if (key.startsWith('eq.')) {
        const field = key.replace('eq.', '');
        const value = req.query[key];
        db[table] = db[table].map(item => {
          if (item[field] == value) {
            const updated = { ...item, ...updates };
            updatedItems.push(updated);
            return updated;
          }
          return item;
        });
      }
    });

    await saveData();
    res.json({ data: updatedItems, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

app.delete('/api/:table', async (req, res) => {
  try {
    const table = req.params.table;

    Object.keys(req.query).forEach(key => {
      if (key.startsWith('eq.')) {
        const field = key.replace('eq.', '');
        const value = req.query[key];
        db[table] = db[table].filter(item => item[field] != value);
      }
    });

    await saveData();
    res.json({ data: null, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message });
  }
});

// Initialize
loadData().then(() => {
  app.listen(PORT, () => {
    console.log(`KirayaTrack DataVault Server running on port ${PORT}`);
  });
});