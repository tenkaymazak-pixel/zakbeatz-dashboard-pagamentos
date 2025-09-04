import initSqlJs from 'sql.js';

class Database {
  constructor() {
    this.db = null;
    this.SQL = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      this.SQL = await initSqlJs({
        // Carrega o arquivo wasm do sql.js
        locateFile: file => `https://sql.js.org/dist/${file}`
      });
      
      // Tenta carregar banco existente do localStorage
      const savedDb = localStorage.getItem('zakbeatz_db');
      
      if (savedDb) {
        const data = new Uint8Array(JSON.parse(savedDb));
        this.db = new this.SQL.Database(data);
      } else {
        this.db = new this.SQL.Database();
        this.createTables();
      }
      
      this.initialized = true;
      console.log('Banco de dados SQLite inicializado!');
    } catch (error) {
      console.error('Erro ao inicializar banco:', error);
      // Fallback: criar banco vazio
      if (this.SQL) {
        this.db = new this.SQL.Database();
        this.createTables();
        this.initialized = true;
      }
    }
  }

  createTables() {
    // Tabela de artistas
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS artists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        rate REAL DEFAULT 50,
        type TEXT DEFAULT 'pacote_horas'
      )
    `);

    // Tabela de sessões
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        artistId TEXT NOT NULL,
        start TEXT,
        pauseStart TEXT,
        pauseEnd TEXT,
        end TEXT,
        totalHours REAL DEFAULT 0,
        note TEXT,
        paidAmount REAL DEFAULT 0,
        packageType TEXT,
        isPackage INTEGER DEFAULT 0,
        hourlyRate REAL DEFAULT 0,
        FOREIGN KEY (artistId) REFERENCES artists (id)
      )
    `);

    // Migração: adicionar coluna type se não existir
    this.migrateAddTypeColumn();
    
    // Migração: adicionar coluna hourlyRate se não existir
    this.migrateAddHourlyRateColumn();
  }

  migrateAddTypeColumn() {
    try {
      // Verificar se a coluna type já existe
      const result = this.db.exec("PRAGMA table_info(sessions)");
      const columns = result[0]?.values || [];
      const hasTypeColumn = columns.some(col => col[1] === 'type');
      
      console.log('Colunas da tabela sessions:', columns.map(col => col[1]));
      
      if (!hasTypeColumn) {
        console.log('Adicionando coluna type à tabela sessions...');
        this.db.exec("ALTER TABLE sessions ADD COLUMN type TEXT DEFAULT 'pacote_horas'");
        this.save();
        console.log('Coluna type adicionada com sucesso!');
        
        // Atualizar sessões existentes com tipo padrão
        this.db.exec("UPDATE sessions SET type = 'pacote_horas' WHERE type IS NULL");
        this.save();
        console.log('Sessões existentes atualizadas com tipo padrão!');
      } else {
        console.log('Coluna type já existe na tabela sessions');
      }
    } catch (error) {
      console.error('Erro na migração:', error);
    }
  }

  migrateAddHourlyRateColumn() {
    try {
      // Verificar se a coluna hourlyRate já existe
      const result = this.db.exec("PRAGMA table_info(sessions)");
      const columns = result[0]?.values || [];
      const hasHourlyRateColumn = columns.some(col => col[1] === 'hourlyRate');
      
      console.log('Colunas da tabela sessions:', columns.map(col => col[1]));
      
      if (!hasHourlyRateColumn) {
        console.log('Adicionando coluna hourlyRate à tabela sessions...');
        this.db.exec("ALTER TABLE sessions ADD COLUMN hourlyRate REAL DEFAULT 0");
        this.save();
        console.log('Coluna hourlyRate adicionada com sucesso!');
        
        // Atualizar sessões existentes com valor padrão
        this.db.exec("UPDATE sessions SET hourlyRate = 0 WHERE hourlyRate IS NULL");
        this.save();
        console.log('Sessões existentes atualizadas com hourlyRate padrão!');
      } else {
        console.log('Coluna hourlyRate já existe na tabela sessions');
      }
    } catch (error) {
      console.error('Erro na migração hourlyRate:', error);
    }
  }



  // CRUD para Artistas
  getArtists() {
    const stmt = this.db.prepare('SELECT * FROM artists ORDER BY name');
    const artists = [];
    while (stmt.step()) {
      artists.push(stmt.getAsObject());
    }
    stmt.free();
    return artists;
  }

  addArtist(artist) {
    this.db.run(
      'INSERT OR IGNORE INTO artists (id, name, rate, type) VALUES (?, ?, ?, ?)',
      [artist.id, artist.name, artist.rate || 50, artist.type || 'pacote_horas']
    );
    this.save();
  }

  updateArtist(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    this.db.run(`UPDATE artists SET ${fields} WHERE id = ?`, [...values, id]);
    this.save();
  }

  deleteArtist(id) {
    // Primeiro deleta as sessões relacionadas
    this.db.run('DELETE FROM sessions WHERE artistId = ?', [id]);
    // Depois deleta o artista
    this.db.run('DELETE FROM artists WHERE id = ?', [id]);
    this.save();
  }

  // CRUD para Sessões
  getSessions() {
    const stmt = this.db.prepare('SELECT * FROM sessions ORDER BY date DESC, id DESC');
    const sessions = [];
    while (stmt.step()) {
      const session = stmt.getAsObject();
      // Converter isPackage de número para boolean
      session.isPackage = Boolean(session.isPackage);
      sessions.push(session);
    }
    stmt.free();
    return sessions;
  }

  addSession(session) {
    // Verificar se a coluna type existe antes de inserir
    try {
      const result = this.db.exec("PRAGMA table_info(sessions)");
      const columns = result[0]?.values || [];
      const hasTypeColumn = columns.some(col => col[1] === 'type');
      
      if (!hasTypeColumn) {
        console.log('Coluna type não encontrada, executando migração...');
        this.migrateAddTypeColumn();
      }
    } catch (error) {
      console.error('Erro ao verificar colunas:', error);
    }

    this.db.run(
      `INSERT INTO sessions 
       (date, artistId, type, start, pauseStart, pauseEnd, end, totalHours, note, paidAmount, packageType, isPackage, hourlyRate) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.date, 
        session.artistId, 
        session.type || 'pacote_horas',
        session.start || null, 
        session.pauseStart || null,
        session.pauseEnd || null, 
        session.end || null, 
        session.totalHours || 0, 
        session.note || null, 
        session.paidAmount || 0, 
        session.packageType || null, 
        session.isPackage ? 1 : 0,
        session.hourlyRate || 0
      ]
    );
    this.save();
  }

  updateSession(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    this.db.run(`UPDATE sessions SET ${fields} WHERE id = ?`, [...values, id]);
    this.save();
  }

  deleteSession(id) {
    this.db.run('DELETE FROM sessions WHERE id = ?', [id]);
    this.save();
  }

  // Salvar banco no localStorage
  save() {
    if (this.db) {
      const data = this.db.export();
      localStorage.setItem('zakbeatz_db', JSON.stringify(Array.from(data)));
    }
  }

  // Exportar banco como arquivo
  exportDatabase() {
    if (this.db) {
      const data = this.db.export();
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'zakbeatz_database.sqlite';
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  // Importar banco de arquivo
  async importDatabase(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          this.db = new this.SQL.Database(data);
          this.save();
          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // Limpar todos os dados
  clearDatabase() {
    this.db.exec('DELETE FROM sessions');
    this.db.exec('DELETE FROM artists');
    this.save();
  }
}

// Instância singleton
const database = new Database();
export default database;
