/**
 * Manager Library - Demo Data Seeder CLI Tool
 * Ficha SENA ADSO 3145555
 */

const API_BASE = process.env.API_URL || 'http://127.0.0.1:8000/api/v1';

async function request(endpoint, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.message || `HTTP ${response.status}`);
    err.status = response.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 MANAGER LIBRARY - DEMO DATA SEEDER');
  console.log(`📡 Conectando a la API: ${API_BASE}`);
  console.log('='.repeat(60));

  // 1. Health check
  try {
    const health = await request('/health');
    console.log(`✅ API Saludable: estado=${health.status}`);
  } catch (err) {
    console.error(`❌ Error al conectar a la API en ${API_BASE}: ${err.message}`);
    console.error('Asegúrate de que el contenedor manager-library-api esté encendido.');
    process.exit(1);
  }

  // 2. Login Admin
  console.log('\n🔑 Autenticando como Administrador (admin)...');
  let token = null;
  try {
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    token = loginRes.access_token;
    console.log(`✅ Token JWT obtenido (expira en ${loginRes.expires_in}s)`);
  } catch (err) {
    console.error(`❌ Error en autenticación: ${err.message}`);
    process.exit(1);
  }

  // 3. Obtener categorías existentes
  console.log('\n📚 Obteniendo categorías del sistema...');
  const catRes = await request('/categories', {}, token);
  const categories = Array.isArray(catRes) ? catRes : (catRes.items || []);
  const catMap = {};
  categories.forEach(c => {
    catMap[c.name.toLowerCase()] = c.id;
  });
  console.log(`✅ ${categories.length} categorías disponibles: ${categories.map(c => c.name).join(', ')}`);

  // 4. Sembrar libros
  console.log('\n📖 Sembrando catálogo de libros...');
  const demoBooks = [
    {
      isbn: '9780307474728',
      title: 'Cien Años de Soledad',
      author: 'Gabriel García Márquez',
      category_id: catMap['novel'],
      total_copies: 5
    },
    {
      isbn: '9780156012195',
      title: 'El Principito',
      author: 'Antoine de Saint-Exupéry',
      category_id: catMap['children'],
      total_copies: 4
    },
    {
      isbn: '9780553380163',
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      category_id: catMap['science'],
      total_copies: 3
    },
    {
      isbn: '9780132350884',
      title: 'Clean Code: A Handbook of Agile Software',
      author: 'Robert C. Martin',
      category_id: catMap['technology'],
      total_copies: 4
    },
    {
      isbn: '9780062316097',
      title: 'Sapiens: De animales a dioses',
      author: 'Yuval Noah Harari',
      category_id: catMap['history'],
      total_copies: 3
    },
    {
      isbn: '9780201633610',
      title: 'Design Patterns: Elements of Reusable OOP',
      author: 'Erich Gamma, Richard Helm',
      category_id: catMap['technology'],
      total_copies: 2
    }
  ];

  const createdBooks = [];
  for (const bookData of demoBooks) {
    if (!bookData.category_id) continue;
    try {
      const created = await request('/books', {
        method: 'POST',
        body: JSON.stringify(bookData)
      }, token);
      console.log(`   + Creado: "${created.title}" (ISBN: ${created.isbn})`);
      createdBooks.push(created);
    } catch (err) {
      if (err.code === 'ISBN_TAKEN' || err.status === 409) {
        console.log(`   * Ya existía: "${bookData.title}" (ISBN: ${bookData.isbn})`);
      } else {
        console.warn(`   ! Error creando "${bookData.title}": ${err.message}`);
      }
    }
  }

  // Obtener libros actuales
  const allBooksRes = await request('/books?size=50', {}, token);
  const currentBooks = allBooksRes.items || [];

  // 5. Sembrar socios
  console.log('\n👥 Sembrando socios lectores...');
  const demoMembers = [
    { full_name: 'Carlos Andrés Mendoza', document_number: '1002345678' },
    { full_name: 'Ana Sofía Herrera', document_number: '1003456789' },
    { full_name: 'Mateo Restrepo Gómez', document_number: '1004567890' },
    { full_name: 'Valentina Morales Paz', document_number: '1005678901' },
    { full_name: 'Daniel Ortiz Silva', document_number: '1006789012' }
  ];

  const createdMembers = [];
  for (const memberData of demoMembers) {
    try {
      const created = await request('/members', {
        method: 'POST',
        body: JSON.stringify(memberData)
      }, token);
      console.log(`   + Socio registrado: ${created.full_name} (${created.document_number})`);
      createdMembers.push(created);
    } catch (err) {
      if (err.code === 'DOCUMENT_TAKEN' || err.status === 409) {
        console.log(`   * Socio ya registrado: ${memberData.full_name} (${memberData.document_number})`);
      } else {
        console.warn(`   ! Error registrando socio: ${err.message}`);
      }
    }
  }

  // Obtener socios actuales
  const allMembersRes = await request('/members?size=50', {}, token);
  const currentMembers = allMembersRes.items || [];

  // 6. Sembrar préstamos y devoluciones
  console.log('\n🔖 Sembrando préstamos transaccionales y devoluciones...');
  if (currentMembers.length > 0 && currentBooks.length >= 2) {
    const availableBooks = currentBooks.filter(b => b.available_copies > 0);
    const eligibleMember = currentMembers.find(m => m.active_loans < 2);

    if (eligibleMember && availableBooks.length >= 2) {
      try {
        const loanPayload = {
          member_id: eligibleMember.id,
          items: [
            { book_id: availableBooks[0].id },
            { book_id: availableBooks[1].id }
          ]
        };
        const loanRes = await request('/loans', {
          method: 'POST',
          body: JSON.stringify(loanPayload)
        }, token);
        console.log(`   + Préstamo creado para ${eligibleMember.full_name} con 2 libros.`);

        // Simular devolución de 1 de las líneas
        if (loanRes.items && loanRes.items.length > 0) {
          const itemToReturn = loanRes.items[0];
          await request(`/loans/${loanRes.id}/items/${itemToReturn.id}/return`, {
            method: 'POST'
          }, token);
          console.log(`   + Devolución simulada de línea: "${itemToReturn.book_title}"`);
        }
      } catch (err) {
        console.log(`   * Info préstamo: ${err.message}`);
      }
    }
  }

  // 7. Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('✨ PROCESO DE SEMBRADO DE DATOS FINALIZADO EXITOSAMENTE');
  console.log('='.repeat(60));
  console.log('Puedes acceder al sistema React con:');
  console.log('  URL:      http://localhost:5173');
  console.log('  Usuario:  admin');
  console.log('  Password: admin123');
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
