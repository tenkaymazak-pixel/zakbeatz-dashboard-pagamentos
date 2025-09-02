import React, { useState } from "react";

const CLIENT_TYPES = {
  producao_semanal: { color: "bg-green-100 text-green-800", icon: "📅", name: "Prod. Semanal" },
  producao_quinzenal: { color: "bg-blue-100 text-blue-800", icon: "🗓️", name: "Prod. Quinzenal" },
  pacote_horas: { color: "bg-purple-100 text-purple-800", icon: "⏰", name: "Pacote Horas" },
  mixagem: { color: "bg-orange-100 text-orange-800", icon: "🎛️", name: "Mixagem" },
  masterizacao: { color: "bg-red-100 text-red-800", icon: "🎚️", name: "Masterização" },
  gravacao: { color: "bg-yellow-100 text-yellow-800", icon: "🎤", name: "Gravação" },
  montagem_show: { color: "bg-pink-100 text-pink-800", icon: "🎪", name: "Show" },
  venda_beat: { color: "bg-indigo-100 text-indigo-800", icon: "💿", name: "Beat" }
};

const PACKAGE_VALUES = { "4h": 200, "8h": 400, "12h": 600, "16h": 800, "20h": 1000 };

const ZakbeatzDashboard = () => {
  const [artists, setArtists] = useState([
    { id: "vic", name: "Vic Wendler", rate: 37.5, type: "producao_semanal" },
    { id: "felipe", name: "Felipe Kaziran", rate: 50, type: "mixagem" },
    { id: "wild", name: "Wild", rate: 50, type: "pacote_horas" },
    { id: "marina", name: "Marina Santos", rate: 45, type: "producao_quinzenal" },
    { id: "carlos", name: "Carlos Beat", rate: 60, type: "masterizacao" },
    { id: "julia", name: "Júlia Vocal", rate: 55, type: "gravacao" },
    { id: "rafael", name: "Rafael Show", rate: 75, type: "montagem_show" },
    { id: "bruno", name: "Bruno Beats", rate: 40, type: "venda_beat" },
  ]);

  const [sessions, setSessions] = useState([
    { id: 1, date: "2025-08-01", artistId: "vic", start: "09:00", pauseStart: "", pauseEnd: "", end: "13:00", totalHours: 4, note: "Produção", paidAmount: 0 },
    { id: 2, date: "2025-08-02", artistId: "felipe", start: "14:00", pauseStart: "16:00", pauseEnd: "16:30", end: "18:00", totalHours: 3.5, note: "Mixagem", paidAmount: 200 },
    { id: 3, date: "2025-08-03", artistId: "marina", start: "10:00", pauseStart: "", pauseEnd: "", end: "14:00", totalHours: 4, note: "Produção Quinzenal", paidAmount: 100 },
    { id: 4, date: "2025-08-04", artistId: "carlos", start: "15:00", pauseStart: "", pauseEnd: "", end: "17:00", totalHours: 2, note: "Masterização EP", paidAmount: 0 },
    { id: 5, date: "2025-08-05", artistId: "julia", start: "11:00", pauseStart: "13:00", pauseEnd: "14:00", end: "15:00", totalHours: 3, note: "Gravação Vocal", paidAmount: 220 },
    { id: 6, date: "2025-08-06", artistId: "rafael", start: "16:00", pauseStart: "", pauseEnd: "", end: "20:00", totalHours: 4, note: "Montagem Show", paidAmount: 150 },
    { id: 7, date: "2025-08-07", artistId: "bruno", start: "13:00", pauseStart: "", pauseEnd: "", end: "16:00", totalHours: 3, note: "Criação Beats", paidAmount: 0 },
    { id: 8, date: "2025-08-08", artistId: "wild", packageType: "8h", totalHours: 8, note: "Pacote 8h", paidAmount: 400, isPackage: true },
  ]);

  const [filters, setFilters] = useState({ artist: "all", type: "all", month: "all", year: "all" });
  const [form, setForm] = useState({ artist: "felipe", note: "", date: new Date().toISOString().split("T")[0], packageType: "8h" });
  const [newArtist, setNewArtist] = useState({ name: "", rate: 50, type: "pacote_horas" });
  const [showNewForm, setShowNewForm] = useState(false);

  // Utility functions
  const getArtist = (id) => artists.find(a => a.id === id);
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const formatDate = (d) => new Date(d).toLocaleDateString("pt-BR");
  const timeToMinutes = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

  // Filtered data
  const filteredSessions = sessions.filter(s => {
    const artist = getArtist(s.artistId);
    const sessionMonth = new Date(s.date).getMonth() + 1;
    const sessionYear = new Date(s.date).getFullYear();
    
    return (filters.artist === "all" || s.artistId === filters.artist) &&
           (filters.type === "all" || artist?.type === filters.type) &&
           (filters.year === "all" || filters.year === sessionYear.toString()) &&
           (filters.month === "all" || filters.month === sessionMonth.toString().padStart(2, '0'));
  });

  const hoursByArtist = filteredSessions.reduce((acc, s) => {
    acc[s.artistId] = acc[s.artistId] || { hours: 0, paid: 0 };
    acc[s.artistId].hours += s.totalHours || 0;
    acc[s.artistId].paid += s.paidAmount || 0;
    return acc;
  }, {});

  const visibleArtists = artists.filter(artist => {
    const data = hoursByArtist[artist.id];
    const matchesFilters = (filters.artist === "all" || artist.id === filters.artist) &&
                          (filters.type === "all" || artist.type === filters.type);
    return data && data.hours * artist.rate > 0 && matchesFilters;
  });

  // Event handlers
  const addSession = () => {
    const newId = Math.max(...sessions.map(s => s.id), 0) + 1;
    const artist = getArtist(form.artist);
    
    const newSession = artist?.type === "pacote_horas" ? {
      id: newId, date: form.date, artistId: form.artist, note: form.note,
      packageType: form.packageType, totalHours: parseInt(form.packageType),
      paidAmount: PACKAGE_VALUES[form.packageType], isPackage: true
    } : {
      id: newId, date: form.date, artistId: form.artist,
      start: "", pauseStart: "", pauseEnd: "", end: "", totalHours: 0, note: form.note, paidAmount: 0
    };
    
    setSessions(prev => [...prev, newSession]);
    setForm(prev => ({ ...prev, note: "" }));
  };

  const addArtist = () => {
    if (!newArtist.name.trim()) return;
    const id = newArtist.name.toLowerCase().replace(/\s+/g, "_");
    setArtists(prev => [...prev, { ...newArtist, id, rate: Number(newArtist.rate) }]);
    setForm(prev => ({ ...prev, artist: id }));
    setNewArtist({ name: "", rate: 50, type: "pacote_horas" });
    setShowNewForm(false);
  };

  const updateTime = (id, field, value) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: value };
      
      if (updated.start && updated.end) {
        let totalMinutes = timeToMinutes(updated.end) - timeToMinutes(updated.start);
        
        if (updated.pauseStart && updated.pauseEnd) {
          const pauseMinutes = timeToMinutes(updated.pauseEnd) - timeToMinutes(updated.pauseStart);
          totalMinutes -= pauseMinutes;
        }
        
        updated.totalHours = Math.max(0, totalMinutes / 60);
      }
      return updated;
    }));
  };

  const updatePaid = (artistId, value) => {
    const amount = parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    setSessions(prev => prev.map(s => 
      s.artistId === artistId ? { ...s, paidAmount: amount } : s
    ));
  };

  const removeSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const ClientCard = ({ artist, hours, paid }) => {
    const total = hours * artist.rate;
    const remaining = total - paid;
    const style = CLIENT_TYPES[artist.type];

    return (
      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-sm">{artist.name}</span>
          <div className="flex gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${style.color}`}>
              {style.icon} {style.name}
            </span>
            <span className="text-xs bg-blue-100 px-2 py-1 rounded-full text-blue-700">
              {brl(artist.rate)}/h
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center bg-gray-50 rounded p-2">
            <div className="font-bold text-lg text-blue-600">{hours.toFixed(1)}h</div>
            <div className="text-xs text-gray-500">Trabalhadas</div>
          </div>
          <div className="text-center bg-gray-50 rounded p-2">
            <div className="font-bold text-lg text-green-600">{brl(total)}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <input 
            type="text" 
            value={brl(paid)}
            onChange={(e) => updatePaid(artist.id, e.target.value)} 
            className="w-full border rounded px-3 py-2 text-sm text-center"
            placeholder="Valor Pago"
          />
          {remaining > 0 ? (
            <div className="text-xs text-red-600 text-center bg-red-50 rounded px-2 py-1">
              Restante: {brl(remaining)}
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

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">ZAKBEATZ OS</h1>
          <p className="text-sm text-gray-600">Sessions • Artistas • Pagamentos</p>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
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

        {/* Total */}
        <div className="mb-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 text-center">
          <div className="text-sm font-medium mb-1">Total Recebido</div>
          <div className="text-2xl font-bold">
            {brl(visibleArtists.reduce((total, artist) => total + (hoursByArtist[artist.id]?.paid || 0), 0))}
          </div>
        </div>

        {/* Client Cards */}
        <div>
          <h3 className="text-sm font-semibold mb-4 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded">
            Controle por Cliente
          </h3>
          <div className="space-y-3">
            {visibleArtists.map(artist => (
              <ClientCard
                key={artist.id}
                artist={artist}
                hours={hoursByArtist[artist.id].hours}
                paid={hoursByArtist[artist.id].paid}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Form */}
        <div className="p-6 border-b bg-white">
          <h2 className="text-xl font-semibold mb-4">Adicionar Session</h2>
          
          <div className="grid grid-cols-5 gap-4 items-end">
            <div className="col-span-2">
              <div className="flex gap-2">
                <select 
                  value={form.artist} 
                  onChange={e => setForm(prev => ({ ...prev, artist: e.target.value }))} 
                  className="flex-1 border rounded px-3 py-2 text-sm"
                >
                  {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <button 
                  onClick={() => setShowNewForm(!showNewForm)} 
                  className="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
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

            {getArtist(form.artist)?.type === "pacote_horas" ? (
              <select 
                value={form.packageType} 
                onChange={e => setForm(prev => ({ ...prev, packageType: e.target.value }))}
                className="border rounded px-3 py-2 text-sm"
              >
                {Object.entries(PACKAGE_VALUES).map(([hours, value]) => (
                  <option key={hours} value={hours}>{hours} - R$ {value}</option>
                ))}
              </select>
            ) : (
              <textarea 
                value={form.note} 
                onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))} 
                placeholder="Resumo..." 
                className="border rounded px-3 py-2 text-sm h-10 resize-none"
              />
            )}

            <button 
              onClick={addSession} 
              className="px-4 py-2 bg-black text-white rounded text-sm hover:bg-gray-800"
            >
              Adicionar
            </button>
          </div>

          {/* New Artist Form */}
          {showNewForm && (
            <div className="mt-4 p-4 bg-blue-50 rounded border-blue-200">
              <div className="grid grid-cols-5 gap-4">
                <div className="col-span-2">
                  <input 
                    type="text" 
                    placeholder="Nome do cliente..." 
                    value={newArtist.name} 
                    onChange={e => setNewArtist(prev => ({ ...prev, name: e.target.value }))} 
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <select 
                  value={newArtist.type} 
                  onChange={e => setNewArtist(prev => ({ ...prev, type: e.target.value }))}
                  className="border rounded px-3 py-2 text-sm"
                >
                  {Object.entries(CLIENT_TYPES).map(([id, type]) => (
                    <option key={id} value={id}>{type.icon} {type.name}</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  step="0.5" 
                  placeholder="Valor/hora" 
                  value={newArtist.rate} 
                  onChange={e => setNewArtist(prev => ({ ...prev, rate: e.target.value }))} 
                  className="border rounded px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={addArtist} className="flex-1 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                    Salvar
                  </button>
                  <button onClick={() => setShowNewForm(false)} className="flex-1 px-3 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sessions Table */}
        <div className="flex-1 p-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Histórico ({filteredSessions.length})</h2>
          </div>
          
          <div className="bg-white border rounded-lg overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Artista</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Início</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pausa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reinício</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fim</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resumo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSessions.map(session => {
                  const artist = getArtist(session.artistId);
                  const style = CLIENT_TYPES[artist?.type];
                  const isPackage = artist?.type === "pacote_horas";
                  
                  return (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{formatDate(session.date)}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {artist?.name} <span className="text-xs">{style?.icon}</span>
                      </td>
                      
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${style?.color}`}>
                          {style?.icon} {style?.name}
                        </span>
                      </td>
                      
                      <td className="px-4 py-3">
                        {isPackage ? (
                          <div className="bg-purple-50 rounded p-2 text-center">
                            <span className="text-sm font-medium text-purple-700">
                              📦 {session.packageType} - {brl(PACKAGE_VALUES[session.packageType])}
                            </span>
                          </div>
                        ) : (
                          <input 
                            type="time" 
                            value={session.start || ""} 
                            onChange={e => updateTime(session.id, "start", e.target.value)} 
                            className="border rounded px-2 py-1 text-xs w-16"
                          />
                        )}
                      </td>
                      
                      <td className="px-4 py-3">
                        {!isPackage && (
                          <input 
                            type="time" 
                            value={session.pauseStart || ""} 
                            onChange={e => updateTime(session.id, "pauseStart", e.target.value)} 
                            className="border rounded px-2 py-1 text-xs w-16"
                          />
                        )}
                      </td>
                      
                      <td className="px-4 py-3">
                        {!isPackage && (
                          <input 
                            type="time" 
                            value={session.pauseEnd || ""} 
                            onChange={e => updateTime(session.id, "pauseEnd", e.target.value)} 
                            className="border rounded px-2 py-1 text-xs w-16"
                          />
                        )}
                      </td>
                      
                      <td className="px-4 py-3">
                        {!isPackage && (
                          <input 
                            type="time" 
                            value={session.end || ""} 
                            onChange={e => updateTime(session.id, "end", e.target.value)} 
                            className="border rounded px-2 py-1 text-xs w-16"
                          />
                        )}
                      </td>
                      
                      <td className="px-4 py-3 text-sm font-medium">
                        {isPackage ? (
                          <span className="text-purple-600">{session.packageType}</span>
                        ) : (
                          <span>{(session.totalHours || 0).toFixed(1)}h</span>
                        )}
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
  );
};

export default ZakbeatzDashboard;