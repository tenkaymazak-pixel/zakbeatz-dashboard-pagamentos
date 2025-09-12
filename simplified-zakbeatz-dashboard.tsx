import React, { useState, useEffect } from "react";
import database from "./database.js";

const CLIENT_TYPES = {
  producao_semanal: { color: "bg-green-100 text-green-800", icon: "📅", name: "Prod. Semanal" },
  producao_quinzenal: { color: "bg-blue-100 text-blue-800", icon: "🗓️", name: "Prod. Quinzenal" },
  parceria_contrapartida: { color: "bg-teal-100 text-teal-800", icon: "🤝", name: "Parceria/Contrapartida" },
  producao_musical: { color: "bg-purple-100 text-purple-800", icon: "🎵", name: "Produção Musical" },
  mixagem: { color: "bg-orange-100 text-orange-800", icon: "🎛️", name: "Mixagem" },
  masterizacao: { color: "bg-red-100 text-red-800", icon: "🎚️", name: "Masterização" },
  gravacao: { color: "bg-yellow-100 text-yellow-800", icon: "🎤", name: "Gravação" },
  montagem_show: { color: "bg-pink-100 text-pink-800", icon: "🎪", name: "Show" },
  venda_beat: { color: "bg-indigo-100 text-indigo-800", icon: "💿", name: "Beat" }
};

const PACKAGE_VALUES = { "4h": 200, "8h": 400, "12h": 600, "16h": 800, "20h": 1000 };

const ZakbeatzDashboard = () => {
  const [artists, setArtists] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ artist: "all", type: "all", month: "all", year: "all" });
  const [form, setForm] = useState({ 
    artist: "", 
    type: "producao_musical", 
    note: "", 
    date: new Date().toISOString().split("T")[0], 
    start: "",
    pauseStart: "",
    pauseEnd: "",
    end: "",
    totalHours: 0,
    hourlyRate: 0
  });
  
  // Estado para controlar visibilidade dos valores
  const [showValues, setShowValues] = useState(false);
  const [newArtist, setNewArtist] = useState({ name: "" });
  const [showNewForm, setShowNewForm] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  // Carregar dados do banco
  useEffect(() => {
    const loadData = async () => {
      try {
        await database.init();
        const artistsData = database.getArtists();
        const sessionsData = database.getSessions();
        
        setArtists(artistsData);
        setSessions(sessionsData);
        
        // Definir primeiro artista como padrão no formulário
        if (artistsData.length > 0) {
          setForm(prev => ({ ...prev, artist: artistsData[0].id }));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Fechar sidebar quando clicar fora (mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSidebar && window.innerWidth < 1024) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && !sidebar.contains(event.target)) {
          setShowSidebar(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSidebar]);

  // Utility functions
  const getArtist = (id) => artists.find(a => a.id === id);
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const formatDate = (d) => new Date(d).toLocaleDateString("pt-BR");
  const timeToMinutes = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  
  // Funções para gerenciar pagamentos
  const addPayment = (artistId, amount) => {
    const payments = JSON.parse(localStorage.getItem(`payments_${artistId}`) || '[]');
    const newPayment = {
      id: Date.now(),
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      artistId
    };
    payments.push(newPayment);
    localStorage.setItem(`payments_${artistId}`, JSON.stringify(payments));
    
    // Atualizar o estado para refletir a mudança
    setSessions(prev => [...prev]);
  };
  
  const getPayments = (artistId) => {
    return JSON.parse(localStorage.getItem(`payments_${artistId}`) || '[]');
  };
  
  const removePayment = (artistId, paymentId) => {
    const payments = getPayments(artistId);
    const updatedPayments = payments.filter(p => p.id !== paymentId);
    localStorage.setItem(`payments_${artistId}`, JSON.stringify(updatedPayments));
    
    // Atualizar o estado para refletir a mudança
    setSessions(prev => [...prev]);
  };
  
  // Verificar se o tipo usa campos de tempo
  const usesTimeFields = (type) => {
    return ['producao_semanal', 'producao_quinzenal', 'parceria_contrapartida'].includes(type);
  };
  
  // Função para mascarar valores
  const maskValue = (value) => {
    if (!showValues) {
      return '••••••';
    }
    return value;
  };

  // Filtered data
  const filteredSessions = sessions.filter(s => {
    const sessionMonth = new Date(s.date).getMonth() + 1;
    const sessionYear = new Date(s.date).getFullYear();
    
    return (filters.artist === "all" || s.artistId === filters.artist) &&
           (filters.type === "all" || s.type === filters.type) &&
           (filters.year === "all" || filters.year === sessionYear.toString()) &&
           (filters.month === "all" || filters.month === sessionMonth.toString().padStart(2, '0'));
  });

  const hoursByArtist = filteredSessions.reduce((acc, s) => {
    acc[s.artistId] = acc[s.artistId] || { hours: 0, total: 0, paid: 0 };
    acc[s.artistId].hours += s.totalHours || 0;
    
    // Calcular valor total baseado nas horas e taxa horária do artista
    const artist = artists.find(a => a.id === s.artistId);
    if (artist && artist.rate > 0) {
      acc[s.artistId].total += (s.totalHours || 0) * artist.rate;
    }
    
    // Calcular valor pago baseado nos pagamentos registrados
    const payments = getPayments(s.artistId);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    acc[s.artistId].paid = totalPaid;
    
    return acc;
  }, {});

  const visibleArtists = artists.filter(artist => {
    const data = hoursByArtist[artist.id];
    const hasSessionsOfType = filters.type === "all" || 
      filteredSessions.some(s => s.artistId === artist.id);
    const matchesFilters = (filters.artist === "all" || artist.id === filters.artist) && hasSessionsOfType;
    return data && data.hours * artist.rate > 0 && matchesFilters;
  });

  // Event handlers
  const addSession = () => {
    let newSession;
    
    if (usesTimeFields(form.type)) {
      // Para Produção Semanal, Quinzenal e Parceria - usar campos de tempo
      let totalHours = 0;
      if (form.start && form.end) {
        let totalMinutes = timeToMinutes(form.end) - timeToMinutes(form.start);
        if (form.pauseStart && form.pauseEnd) {
          const pauseMinutes = timeToMinutes(form.pauseEnd) - timeToMinutes(form.pauseStart);
          totalMinutes -= pauseMinutes;
        }
        totalHours = Math.max(0, totalMinutes / 60);
      }
      
      // Calcular o valor total baseado no valor por hora e horas trabalhadas
      const totalValue = totalHours * (form.hourlyRate || 0);
      
      newSession = {
        date: form.date,
        artistId: form.artist,
        type: form.type,
        start: form.start,
        pauseStart: form.pauseStart,
        pauseEnd: form.pauseEnd,
        end: form.end,
        totalHours: totalHours,
        note: form.note,
        paidAmount: totalValue,
        isPackage: false,
        hourlyRate: form.hourlyRate || 0
      };
    } else {
      // Para outros tipos - usar quantidade e valor por hora
      const artist = getArtist(form.artist);
      const totalValue = (form.totalHours || 0) * (form.hourlyRate || 0);
      
      newSession = {
        date: form.date,
        artistId: form.artist,
        type: form.type,
        note: form.note,
        totalHours: form.totalHours || 0,
        paidAmount: totalValue,
        isPackage: false,
        hourlyRate: form.hourlyRate || 0
      };
    }
    
    database.addSession(newSession);
    setSessions(database.getSessions());
    setForm(prev => ({ 
      ...prev, 
      note: "",
      start: "",
      pauseStart: "",
      pauseEnd: "",
      end: "",
      totalHours: 0,
      hourlyRate: 0
    }));
  };

  const addArtist = () => {
    if (!newArtist.name.trim()) return;
    const id = newArtist.name.toLowerCase().replace(/\s+/g, "_");
    const artist = { 
      ...newArtist, 
      id, 
      rate: 50, // Valor padrão
      type: "pacote_horas" // Tipo padrão
    };
    
    database.addArtist(artist);
    setArtists(database.getArtists());
    setForm(prev => ({ ...prev, artist: id }));
    setNewArtist({ name: "" });
    setShowNewForm(false);
  };

  const updateTime = (id, field, value) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    
    const updated = { ...session, [field]: value };
    
    if (updated.start && updated.end) {
      let totalMinutes = timeToMinutes(updated.end) - timeToMinutes(updated.start);
      
      if (updated.pauseStart && updated.pauseEnd) {
        const pauseMinutes = timeToMinutes(updated.pauseEnd) - timeToMinutes(updated.pauseStart);
        totalMinutes -= pauseMinutes;
      }
      
      updated.totalHours = Math.max(0, totalMinutes / 60);
      
      // Atualizar taxa horária baseada no artista atual
      const artist = artists.find(a => a.id === session.artistId);
      if (artist && artist.rate > 0) {
        updated.hourlyRate = artist.rate;
      }
    }
    
    database.updateSession(id, updated);
    setSessions(database.getSessions());
  };

  const updatePaid = (artistId, value) => {
    const amount = parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    
    // Atualizar todas as sessões do artista
    sessions.forEach(session => {
      if (session.artistId === artistId) {
        database.updateSession(session.id, { paidAmount: amount });
      }
    });
    
    setSessions(database.getSessions());
  };

  const removeSession = (id) => {
    database.deleteSession(id);
    setSessions(database.getSessions());
  };

  const removeArtist = (id) => {
    if (window.confirm('Tem certeza que deseja remover este artista? Todas as sessões relacionadas também serão removidas.')) {
      database.deleteArtist(id);
      setArtists(database.getArtists());
      setSessions(database.getSessions());
    }
  };

  const ClientCard = ({ artist, hours, paid, total }) => {
    const remaining = total - paid; // Valor restante
    const style = CLIENT_TYPES[artist.type];

    return (
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-sm">{artist.name}</span>
          <button 
            onClick={() => removeArtist(artist.id)}
            className="text-red-500 hover:bg-red-50 rounded px-1 text-xs"
            title="Remover artista"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center bg-gray-50 rounded p-2">
            <div className="font-bold text-lg text-blue-600">{hours.toFixed(1)}h</div>
            <div className="text-xs text-gray-500">Trabalhadas</div>
          </div>
          <div className="text-center bg-gray-50 rounded p-2">
            <div className="font-bold text-lg text-green-600">{showValues ? brl(total) : maskValue(brl(total))}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => {
                setSelectedArtist(artist);
                setPaymentAmount("");
                setShowPaymentModal(true);
              }}
              className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition-colors"
            >
              💰 Lançar Pagamento
            </button>
            <button 
              onClick={() => {
                setSelectedArtist(artist);
                setShowPaymentHistoryModal(true);
              }}
              className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600 transition-colors"
            >
              📋 Ver Pagamentos
            </button>
          </div>
          {remaining > 0 ? (
            <div className="text-xs text-red-600 text-center bg-red-50 rounded px-2 py-1">
              Restante: {showValues ? brl(remaining) : maskValue(brl(remaining))}
            </div>
          ) : total > 0 && (
            <div className="text-xs text-green-600 text-center bg-green-50 rounded px-2 py-1">
              ✓ Pago
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando banco de dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gray-50 border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">DASHBOARD DE PAGAMENTOS</h1>
        <button 
          onClick={() => setShowSidebar(!showSidebar)}
          className="p-2 bg-blue-500 text-white rounded"
        >
          ☰
        </button>
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-80 bg-gray-50 border-r p-4 lg:p-6 transition-transform duration-300 ease-in-out lg:block overflow-y-auto`}>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">DASHBOARD DE PAGAMENTOS</h1>
              <p className="text-sm text-gray-600">Sessions • Artistas • Pagamentos</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowValues(!showValues)}
                className="p-2 text-gray-500 hover:bg-gray-200 rounded"
                title={showValues ? "Ocultar valores" : "Mostrar valores"}
              >
                {showValues ? "👁️" : "👁️‍🗨️"}
              </button>
              <button 
                onClick={() => setShowSidebar(false)}
                className="lg:hidden p-2 text-gray-500 hover:bg-gray-200 rounded"
              >
                ✕
              </button>
            </div>
          </div>
          
          {/* Botões de banco de dados */}
          <div className="mt-4 space-y-2">
            <button 
              onClick={() => database.exportDatabase()}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              💾 Exportar Banco
            </button>
            <label className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 cursor-pointer block text-center">
              📁 Importar Banco
              <input 
                type="file" 
                accept=".sqlite,.db"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    database.importDatabase(file).then(() => {
                      setArtists(database.getArtists());
                      setSessions(database.getSessions());
                      alert('Banco importado com sucesso!');
                    }).catch(err => {
                      alert('Erro ao importar banco: ' + err.message);
                    });
                  }
                }}
                className="hidden"
              />
            </label>
            <button 
              onClick={() => {
                if (window.confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
                  database.clearDatabase();
                  setArtists([]);
                  setSessions([]);
                  alert('Banco limpo com sucesso!');
                }
              }}
              className="w-full px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              🗑️ Limpar Banco
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-6">
          <select 
            value={filters.artist} 
            onChange={e => setFilters(prev => ({ ...prev, artist: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="all">— Todos os artistas —</option>
            {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          <select 
            value={filters.type} 
            onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="all">— Todos os tipos —</option>
            {Object.entries(CLIENT_TYPES).map(([id, type]) => (
              <option key={id} value={id}>{type.icon} {type.name}</option>
            ))}
          </select>

          <select 
            value={filters.year} 
            onChange={e => setFilters(prev => ({ ...prev, year: e.target.value, month: "all" }))}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="all">— Todos os anos —</option>
            {Array.from({length: 4}, (_, i) => 2025 + i).map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>

          <select 
            value={filters.month} 
            onChange={e => setFilters(prev => ({ ...prev, month: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm"
            disabled={filters.year === "all"}
          >
            <option value="all">— Todos os meses —</option>
            {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
              .map((month, i) => (
                <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>{month}</option>
            ))}
          </select>
        </div>

        {/* Totais */}
        <div className="mb-6 space-y-3">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 text-center">
            <div className="text-sm font-medium mb-1">Total Recebido</div>
            <div className="text-2xl font-bold">
              {showValues ? brl(visibleArtists.reduce((total, artist) => total + (hoursByArtist[artist.id]?.paid || 0), 0)) : maskValue(brl(visibleArtists.reduce((total, artist) => total + (hoursByArtist[artist.id]?.paid || 0), 0)))}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-4 text-center">
            <div className="text-sm font-medium mb-1">Total a Receber</div>
            <div className="text-2xl font-bold">
              {showValues ? brl(visibleArtists.reduce((total, artist) => {
                const artistData = hoursByArtist[artist.id];
                return total + (artistData?.total || 0) - (artistData?.paid || 0);
              }, 0)) : maskValue(brl(visibleArtists.reduce((total, artist) => {
                const artistData = hoursByArtist[artist.id];
                return total + (artistData?.total || 0) - (artistData?.paid || 0);
              }, 0)))}
            </div>
          </div>
        </div>

        {/* Client Cards */}
        <div>
          <h3 className="text-sm font-semibold mb-4 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded">
            Controle por Cliente
          </h3>
          <div className="space-y-3 max-h-64 lg:max-h-96 overflow-y-auto">
            {visibleArtists.map(artist => (
              <ClientCard
                key={artist.id}
                artist={artist}
                hours={hoursByArtist[artist.id].hours}
                paid={hoursByArtist[artist.id].paid}
                total={hoursByArtist[artist.id].total}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Overlay para mobile */}
      {showSidebar && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Form */}
        <div className="p-4 lg:p-6 border-b bg-white">
          <h2 className="text-lg lg:text-xl font-semibold mb-4">Adicionar Session</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <select 
                  value={form.artist} 
                  onChange={e => setForm(prev => ({ ...prev, artist: e.target.value }))} 
                  className="flex-1 border rounded px-3 py-2 text-sm"
                >
                  {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <button 
                  onClick={() => setShowNewForm(!showNewForm)} 
                  className="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 whitespace-nowrap"
                >
                  + Cliente
                </button>
              </div>
            </div>

            <input 
              type="date" 
              value={form.date} 
              onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} 
              className="border rounded px-3 py-2 text-sm"
            />

            <select 
              value={form.type} 
              onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
              className="border rounded px-3 py-2 text-sm"
            >
              {Object.entries(CLIENT_TYPES).map(([id, type]) => (
                <option key={id} value={id}>{type.icon} {type.name}</option>
              ))}
            </select>

            {usesTimeFields(form.type) ? (
              // Campo de valor para Produção Semanal, Quinzenal e Parceria
              <input 
                type="number" 
                value={form.hourlyRate || ""} 
                onChange={e => setForm(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))} 
                placeholder="Valor/Hora" 
                className="border rounded px-3 py-2 text-sm"
                step="0.01"
                min="0"
              />
            ) : (
              // Campos de quantidade e valor para outros tipos
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="number" 
                  value={form.totalHours || ""} 
                  onChange={e => setForm(prev => ({ ...prev, totalHours: parseFloat(e.target.value) || 0 }))} 
                  placeholder="Qtd. Horas" 
                  className="border rounded px-3 py-2 text-sm"
                  step="0.5"
                  min="0"
                />
                <input 
                  type="number" 
                  value={form.hourlyRate || ""} 
                  onChange={e => setForm(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))} 
                  placeholder="Valor/Hora" 
                  className="border rounded px-3 py-2 text-sm"
                  step="0.01"
                  min="0"
                />
              </div>
            )}
          </div>



          {/* Terceira linha - resumo e campos de horário */}
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-end mb-4 mt-4">
            <textarea 
              value={form.note} 
              onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))} 
              placeholder="Resumo..." 
              className="border rounded px-3 py-2 text-sm h-10 resize-none lg:col-span-2"
            />
            {usesTimeFields(form.type) && (
              <>
                <input 
                  type="time" 
                  value={form.start || ""} 
                  onChange={e => setForm(prev => ({ ...prev, start: e.target.value }))} 
                  placeholder="Início" 
                  className="border rounded px-3 py-2 text-sm"
                />
                <input 
                  type="time" 
                  value={form.pauseStart || ""} 
                  onChange={e => setForm(prev => ({ ...prev, pauseStart: e.target.value }))} 
                  placeholder="Pausa" 
                  className="border rounded px-3 py-2 text-sm"
                />
                <input 
                  type="time" 
                  value={form.pauseEnd || ""} 
                  onChange={e => setForm(prev => ({ ...prev, pauseEnd: e.target.value }))} 
                  placeholder="Reinício" 
                  className="border rounded px-3 py-2 text-sm"
                />
                <input 
                  type="time" 
                  value={form.end || ""} 
                  onChange={e => setForm(prev => ({ ...prev, end: e.target.value }))} 
                  placeholder="Fim" 
                  className="border rounded px-3 py-2 text-sm"
                />
              </>
            )}
          </div>

          {/* Botão Adicionar */}
          <div className="flex justify-center">
            <button 
              onClick={addSession} 
              className="px-6 py-3 bg-black text-white rounded text-sm hover:bg-gray-800"
            >
              Adicionar
            </button>
          </div>

          {/* New Artist Form */}
          {showNewForm && (
            <div className="mt-4 p-4 bg-blue-50 rounded border-blue-200">
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  placeholder="Nome do cliente..." 
                  value={newArtist.name} 
                  onChange={e => setNewArtist(prev => ({ ...prev, name: e.target.value }))} 
                  className="flex-1 border rounded px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={addArtist} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                    Salvar
                  </button>
                  <button onClick={() => setShowNewForm(false)} className="flex-1 px-4 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400">
                    Cancelar
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                💡 Tipo e valor por hora serão configurados depois
              </p>
            </div>
          )}
        </div>

        {/* Sessions Table */}
        <div className="flex-1 p-4 lg:p-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg lg:text-xl font-semibold">Histórico ({filteredSessions.length})</h2>
          </div>
          
          <div className="bg-white border rounded-lg overflow-auto">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Artista</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-0">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Início/Qtd</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pausa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reinício</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fim/Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resumo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSessions.map(session => {
                  const artist = getArtist(session.artistId);
                  const style = CLIENT_TYPES[session.type];
                  const usesTime = usesTimeFields(session.type);
                  
                  return (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{formatDate(session.date)}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {artist?.name} <span className="text-xs">{style?.icon}</span>
                      </td>
                      
                      <td className="px-4 py-3 min-w-0">
                        <span className={`text-xs px-2 py-1 rounded-full ${style?.color} whitespace-nowrap`}>
                          {style?.icon} {style?.name}
                        </span>
                      </td>
                      
                      <td className="px-4 py-3">
                        {usesTime ? (
                          <input 
                            type="time" 
                            value={session.start || ""} 
                            onChange={e => updateTime(session.id, "start", e.target.value)} 
                            className="border rounded px-2 py-1 text-sm w-25"
                          />
                        ) : (
                          <div className="text-sm text-gray-600">
                            {(session.totalHours || 0).toFixed(1)}h
                          </div>
                        )}
                      </td>
                      
                      <td className="px-4 py-3">
                        {usesTime ? (
                          <input 
                            type="time" 
                            value={session.pauseStart || ""} 
                            onChange={e => updateTime(session.id, "pauseStart", e.target.value)} 
                            className="border rounded px-2 py-1 text-sm w-25"
                          />
                        ) : (
                          <div className="text-sm text-gray-600">
                            —
                          </div>
                        )}
                      </td>
                      
                      <td className="px-4 py-3">
                        {usesTime ? (
                          <input 
                            type="time" 
                            value={session.pauseEnd || ""} 
                            onChange={e => updateTime(session.id, "pauseEnd", e.target.value)} 
                            className="border rounded px-2 py-1 text-sm w-25"
                          />
                        ) : (
                          <div className="text-sm text-gray-600">
                            —
                          </div>
                        )}
                      </td>
                      
                      <td className="px-4 py-3">
                        {usesTime ? (
                          <input 
                            type="time" 
                            value={session.end || ""} 
                            onChange={e => updateTime(session.id, "end", e.target.value)} 
                            className="border rounded px-2 py-1 text-sm w-25"
                          />
                        ) : (
                          <div className="text-sm text-gray-600">
                            {showValues ? brl(session.paidAmount || 0) : maskValue(brl(session.paidAmount || 0))}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-4 py-3 text-sm font-medium">
                        <span>{(session.totalHours || 0).toFixed(1)}h</span>
                      </td>
                      
                      <td className="px-4 py-3 text-sm">
                        <div className="bg-gray-50 rounded px-2 py-1 text-xs w-32 truncate">
                          {session.note || "—"}
                        </div>
                      </td>
                      
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => removeSession(session.id)} 
                          className="text-red-600 hover:bg-red-50 rounded px-2 py-1"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de Lançar Pagamento */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">
              Lançar Pagamento - {selectedArtist?.name}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor do Pagamento
              </label>
              <input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="0,00"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  if (paymentAmount && parseFloat(paymentAmount) > 0) {
                    addPayment(selectedArtist.id, paymentAmount);
                    setShowPaymentModal(false);
                    setPaymentAmount("");
                    setSelectedArtist(null);
                  }
                }}
                className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
              >
                Lançar Pagamento
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount("");
                  setSelectedArtist(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Histórico de Pagamentos */}
      {showPaymentHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              Histórico de Pagamentos - {selectedArtist?.name}
            </h3>
            {(() => {
              const payments = getPayments(selectedArtist?.id);
              const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
              const artistData = hoursByArtist[selectedArtist?.id];
              const remaining = (artistData?.total || 0) - totalPaid;
              
              return (
                <div>
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <div className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span>Total das sessões:</span>
                        <span className="font-medium">{showValues ? brl(artistData?.total || 0) : maskValue(brl(artistData?.total || 0))}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>Total pago:</span>
                        <span className="font-medium text-green-600">{showValues ? brl(totalPaid) : maskValue(brl(totalPaid))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Restante:</span>
                        <span className={`font-medium ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {showValues ? brl(remaining) : maskValue(brl(remaining))}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {payments.length > 0 ? (
                    <div className="space-y-2">
                      {payments.map(payment => (
                        <div key={payment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <div className="text-sm font-medium">{brl(payment.amount)}</div>
                            <div className="text-xs text-gray-500">{formatDate(payment.date)}</div>
                          </div>
                          <button
                            onClick={() => removePayment(selectedArtist.id, payment.id)}
                            className="text-red-500 hover:bg-red-50 rounded px-2 py-1 text-xs"
                            title="Remover pagamento"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      Nenhum pagamento registrado
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowPaymentHistoryModal(false);
                      setSelectedArtist(null);
                    }}
                    className="w-full mt-4 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                  >
                    Fechar
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ZakbeatzDashboard;