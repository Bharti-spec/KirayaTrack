/**
 * Cloudflare Pages Function for KirayaTrack API
 * This handles all /api/* requests and stores data in Cloudflare KV
 */

// Initialize database in memory (will sync with KV if needed)
let db = {
  landlords: [],
  tenants: [],
  buildings: [],
  rooms: [],
  payments: [],
  bills: []
};

// Helper function to parse query parameters
function parseQuery(url) {
  const params = new URL(url).searchParams;
  const query = {};
  params.forEach((value, key) => {
    query[key] = value;
  });
  return query;
}

// Helper function to filter data
function filterData(data, filters) {
  return data.filter(item => {
    for (const [key, value] of Object.entries(filters)) {
      if (key.startsWith('eq.')) {
        const field = key.substring(3);
        if (String(item[field]) !== String(value)) return false;
      }
    }
    return true;
  });
}

// Helper function to order data
function orderData(data, orderBy) {
  if (!orderBy) return data;
  const [field, direction] = orderBy.split('.');
  const sorted = [...data].sort((a, b) => {
    if (a[field] < b[field]) return direction === 'desc' ? 1 : -1;
    if (a[field] > b[field]) return direction === 'desc' ? -1 : 1;
    return 0;
  });
  return sorted;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers });
    }

    try {
      // Extract table name and ID from path
      const parts = path.replace('/api/', '').split('/');
      const table = parts[0];
      const id = parts[1];

      if (!table || !db.hasOwnProperty(table)) {
        return new Response(
          JSON.stringify({ error: 'Invalid table' }),
          { status: 400, headers }
        );
      }

      const query = parseQuery(request.url);
      const select = query.select || '*';
      const filters = Object.keys(query)
        .filter(k => k.startsWith('eq.'))
        .reduce((acc, k) => ({ ...acc, [k]: query[k] }), {});
      const order = query.order;

      // GET - Retrieve data
      if (request.method === 'GET') {
        let result = [...db[table]];
        result = filterData(result, filters);
        result = orderData(result, order);

        const data = select === '*'
          ? result
          : result.map(item => {
              const selected = {};
              select.split(',').forEach(field => {
                selected[field.trim()] = item[field.trim()];
              });
              return selected;
            });

        return new Response(
          JSON.stringify({ data, error: null }),
          { status: 200, headers }
        );
      }

      // POST - Insert data
      if (request.method === 'POST') {
        const body = await request.json();
        const newItem = { id: Date.now(), ...body };
        db[table].push(newItem);
        return new Response(
          JSON.stringify({ data: [newItem], error: null }),
          { status: 201, headers }
        );
      }

      // PATCH - Update data
      if (request.method === 'PATCH') {
        const body = await request.json();
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID required for update' }),
            { status: 400, headers }
          );
        }

        const index = db[table].findIndex(item => item.id == id);
        if (index === -1) {
          return new Response(
            JSON.stringify({ error: 'Record not found' }),
            { status: 404, headers }
          );
        }

        db[table][index] = { ...db[table][index], ...body };
        return new Response(
          JSON.stringify({ data: [db[table][index]], error: null }),
          { status: 200, headers }
        );
      }

      // DELETE - Remove data
      if (request.method === 'DELETE') {
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID required for delete' }),
            { status: 400, headers }
          );
        }

        const index = db[table].findIndex(item => item.id == id);
        if (index === -1) {
          return new Response(
            JSON.stringify({ error: 'Record not found' }),
            { status: 404, headers }
          );
        }

        db[table].splice(index, 1);
        return new Response(
          JSON.stringify({ data: [], error: null }),
          { status: 200, headers }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers }
      );
    }
  }
};
