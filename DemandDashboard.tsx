import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Edit2,
  X,
  Trash2,
  Plus,
  Download,
  Search,
  UserCheck,
  User,
  Clock,
  ChevronDown,
  Save,
  Users,
  CalendarDays,
} from 'lucide-react';
import { supabase, type Employee } from '@/lib/supabase';

const availableStatuses = ['Ativo', 'Ausente', 'Aguardando inicio'];

function statusDotColor(status: string) {
  if (status === 'Ativo') return 'bg-green-500';
  if (status === 'Ausente') return 'bg-red-500';
  return 'bg-yellow-500';
}

function shiftColor(shift: string) {
  if (shift.startsWith('06')) return 'bg-sky-100 text-sky-700';
  if (shift.startsWith('08')) return 'bg-indigo-100 text-indigo-700';
  if (shift.startsWith('13')) return 'bg-amber-100 text-amber-700';
  if (shift.startsWith('22')) return 'bg-slate-200 text-slate-700';
  return 'bg-gray-100 text-gray-600';
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAutoStatus(start: string, end: string, now: Date) {
  const currentTotal = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  if (startTotal < endTotal) {
    if (currentTotal >= startTotal && currentTotal <= endTotal) return 'Ausente';
    return 'Aguardando inicio';
  }
  if (currentTotal >= startTotal || currentTotal <= endTotal) return 'Ausente';
  return 'Aguardando inicio';
}

function statusColor(status: string) {
  if (status === 'Ativo') return 'text-green-600';
  if (status === 'Ausente') return 'text-red-600';
  return 'text-yellow-600';
}

interface FilterDropdownProps {
  title: 'Status' | 'Horário';
  options: string[];
  selected: string[];
  onToggle: (opt: string) => void;
  onClear: () => void;
}

function FilterDropdown({ title, options, selected, onToggle, onClear }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const label =
    selected.length === 0
      ? title === 'Status'
        ? 'Todos os Status'
        : 'Todos os Horários'
      : title === 'Status'
        ? `${selected.length} Status`
        : `${selected.length} Horários`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex min-w-[170px] items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-500 transition hover:border-gray-400"
      >
        <span className={selected.length > 0 ? 'font-semibold text-gray-900' : ''}>{label}</span>
        <ChevronDown size={16} className="text-gray-500" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[110%] z-20 max-h-[200px] overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center border-b border-gray-50 px-3 py-2.5 text-sm text-gray-700 transition last:border-0 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => onToggle(opt)}
                className="mr-2.5 cursor-pointer"
              />
              {opt}
            </label>
          ))}
          {selected.length > 0 && (
            <div
              onClick={onClear}
              className="cursor-pointer py-2 text-center text-xs font-bold text-blue-600"
            >
              Limpar Filtros
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DemandDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalForm, setModalForm] = useState({ demandas: '', situacao: '', status: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phone: '', start: '', end: '' });
  const [saving, setSaving] = useState(false);

  const loadEmployees = useCallback(async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('id', { ascending: true });
    if (error) {
      setError('Não foi possível carregar os colaboradores.');
      return;
    }
    setEmployees((data as Employee[]) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadEmployees();
      setLoading(false);
    })();
  }, [loadEmployees]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getStatus = (emp: Employee) => {
    if (emp.manual_status) return emp.manual_status;
    return getAutoStatus(emp.start_time, emp.end_time, currentTime);
  };

  const handleStatusClick = async (emp: Employee) => {
    const currentStatus = getStatus(emp);
    let nextStatus: string | null = '';
    if (currentStatus === 'Aguardando inicio') nextStatus = 'Ausente';
    else if (currentStatus === 'Ausente') nextStatus = 'Ativo';
    else if (currentStatus === 'Ativo') nextStatus = null;
    else nextStatus = 'Aguardando inicio';

    setEmployees((prev) =>
      prev.map((e) => (e.id === emp.id ? { ...e, manual_status: nextStatus } : e)),
    );
    await supabase
      .from('employees')
      .update({ manual_status: nextStatus })
      .eq('id', emp.id);
  };

  const availableShifts = [...new Set(employees.map((e) => e.shift))].sort();

  const filteredEmployees = employees.filter((emp) => {
    const status = getStatus(emp);
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(status);
    const matchesShift = selectedShifts.length === 0 || selectedShifts.includes(emp.shift);
    return matchesSearch && matchesStatus && matchesShift;
  });

  const totalListados = filteredEmployees.length;
  const countAtivos = filteredEmployees.filter((e) => getStatus(e) === 'Ativo').length;
  const countAusentes = filteredEmployees.filter((e) => getStatus(e) === 'Ausente').length;
  const countAguardando = filteredEmployees.filter((e) => getStatus(e) === 'Aguardando inicio').length;

  const openModal = (emp: Employee) => {
    setModalForm({ demandas: emp.demandas ?? '', situacao: emp.situacao ?? '', status: emp.manual_status ?? 'Automático' });
    setEditingId(emp.id);
  };

  const saveModal = async () => {
    if (editingId === null) return;
    setSaving(true);
    const { error: updateError } = await supabase
      .from('employees')
      .update({
        demandas: modalForm.demandas,
        situacao: modalForm.situacao,
        manual_status: modalForm.status === 'Automático' ? null : modalForm.status,
      })
      .eq('id', editingId);
    setSaving(false);
    if (updateError) {
      setError('Falha ao salvar as alterações.');
      return;
    }
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === editingId
          ? {
              ...e,
              demandas: modalForm.demandas,
              situacao: modalForm.situacao,
              manual_status: modalForm.status === 'Automático' ? null : modalForm.status,
            }
          : e,
      ),
    );
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover este colaborador?')) return;
    const { error: delError } = await supabase.from('employees').delete().eq('id', id);
    if (delError) {
      setError('Não foi possível remover o colaborador.');
      return;
    }
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId =
      employees.length > 0 ? Math.max(...employees.map((e) => e.id)) + 1 : 1;
    const newEmp = {
      id: newId,
      name: addForm.name.toUpperCase(),
      phone: addForm.phone,
      shift: `${addForm.start} as ${addForm.end}`,
      start_time: addForm.start,
      end_time: addForm.end,
    };
    const { data, error: insertError } = await supabase
      .from('employees')
      .insert(newEmp)
      .select()
      .single();
    if (insertError) {
      setError('Não foi possível cadastrar o colaborador.');
      return;
    }
    setEmployees((prev) => [...prev, data as Employee]);
    setIsAddModalOpen(false);
    setAddForm({ name: '', phone: '', start: '', end: '' });
  };

  const exportToCSV = () => {
    let csv = 'Nome;Telefone;Horario;Status;Demandas;Situacao Atual\n';
    filteredEmployees.forEach((emp) => {
      const status = getStatus(emp);
      const demandas = (emp.demandas || '').replace(/\n/g, ' ');
      const situacao = (emp.situacao || '').replace(/\n/g, ' ');
      csv += `"${emp.name}";"${emp.phone}";"${emp.shift}";"${status}";"${demandas}";"${situacao}"\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Demandas_${new Date().toLocaleDateString('pt-BR')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const editingEmp = editingId !== null ? employees.find((e) => e.id === editingId) : null;

  return (
    <div className="min-h-screen bg-gray-100 p-5 font-sans">
      {/* Top Header */}
      <div className="mx-auto mb-5 flex max-w-[1200px] flex-wrap items-center justify-between gap-4 rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 px-6 py-5 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-[150px] items-center justify-center rounded-xl bg-white px-3 shadow-sm ring-1 ring-white/20">
            <span className="text-[22px] font-black tracking-[0.18em] text-slate-900">TELEMONT</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Painel de Acompanhamento Diário — Equipes Lote</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm opacity-85">
              <CalendarDays size={14} />
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}{' • '}{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 rounded-md border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
          >
            <Download size={18} /> Exportar
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-500/30 transition hover:bg-emerald-600"
          >
            <Plus size={18} /> Novo Colaborador
          </button>
        </div>
      </div>

      <div className="mx-auto mb-5 flex max-w-[1200px] flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
        <span className="font-semibold text-slate-700">Acompanhamento diário das equipes</span>
        <span>•</span>
        <span>Controle de status, demandas e situação atual por colaborador.</span>
      </div>

      {error && (
        <div className="mx-auto mb-4 max-w-[1200px] rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Cards Dinâmicos */}
      <div className="mx-auto mb-5 grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {[
          { label: 'Total Listados', value: totalListados, icon: Users, bg: 'bg-blue-50', iconColor: 'text-blue-600', valueColor: 'text-slate-900' },
          { label: 'Ativos', value: countAtivos, icon: UserCheck, bg: 'bg-green-50', iconColor: 'text-green-600', valueColor: 'text-green-600' },
          { label: 'Ausentes', value: countAusentes, icon: User, bg: 'bg-red-50', iconColor: 'text-red-600', valueColor: 'text-red-600' },
          { label: 'Aguardando Início', value: countAguardando, icon: Clock, bg: 'bg-yellow-50', iconColor: 'text-yellow-600', valueColor: 'text-yellow-600' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
                <Icon size={24} className={card.iconColor} />
              </div>
              <div>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {card.label}
                </p>
                <h2 className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</h2>
              </div>
            </div>
          );
        })}
      </div>

      {/* Container da Tabela e Filtros */}
      <div className="mx-auto max-w-[1200px] overflow-hidden rounded-xl bg-white shadow-md">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-4 rounded-t-xl border-b border-slate-200 bg-slate-50 p-5">
          <div className="relative min-w-[250px] flex-1">
            <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500"
            />
          </div>
          <FilterDropdown
            title="Status"
            options={availableStatuses}
            selected={selectedStatuses}
            onToggle={(s) =>
              setSelectedStatuses((prev) =>
                prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
              )
            }
            onClear={() => setSelectedStatuses([])}
          />
          <FilterDropdown
            title="Horário"
            options={availableShifts}
            selected={selectedShifts}
            onToggle={(s) =>
              setSelectedShifts((prev) =>
                prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
              )
            }
            onClear={() => setSelectedShifts([])}
          />
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto px-5 pb-5">
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500">Carregando colaboradores...</div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-500">
                  <th className="w-[25%] px-3 py-4 text-xs font-semibold uppercase">Colaborador</th>
                  <th className="w-[15%] px-3 py-4 text-xs font-semibold uppercase">Horário</th>
                  <th className="w-[25%] px-3 py-4 text-xs font-semibold uppercase">Demandas</th>
                  <th className="w-[25%] px-3 py-4 text-xs font-semibold uppercase">Situação Atual</th>
                  <th className="w-[10%] px-3 py-4 text-center text-xs font-semibold uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => {
                  const status = getStatus(emp);
                  return (
                    <tr
                      key={emp.id}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                    >
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${shiftColor(emp.shift)}`}>
                            {initials(emp.name)}
                          </div>
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-base font-bold tracking-tight text-slate-900">{emp.name}</span>
                            <button
                              onClick={() => handleStatusClick(emp)}
                              className="group inline-flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                              title="Clique para alternar o status"
                            >
                              <span className={`h-2 w-2 rounded-full ${statusDotColor(status)} transition group-hover:scale-125`} />
                              {status}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-sm font-medium text-slate-600">{emp.shift}</td>
                      <td className="whitespace-pre-wrap px-3 py-3.5 text-sm text-slate-600">
                        {emp.demandas || <span className="text-slate-300">-</span>}
                      </td>
                      <td className="whitespace-pre-wrap px-3 py-3.5 text-sm text-slate-600">
                        {emp.situacao || <span className="text-slate-300">-</span>}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openModal(emp)}
                            className="rounded-md border border-blue-200 bg-blue-50 p-1.5 text-blue-600 transition hover:bg-blue-100"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="rounded-md border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100"
                            title="Remover"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loading && filteredEmployees.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-500">
              Nenhum colaborador encontrado com os filtros atuais.
            </div>
          )}
        </div>
      </div>

      {/* Modal de Editar */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[550px] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between bg-gradient-to-br from-blue-900 to-blue-500 p-6 text-white">
              <div>
                <h2 className="mb-3 text-xl font-semibold tracking-tight">{editingEmp.name}</h2>
                <div className="mb-4 flex flex-wrap gap-4 text-sm text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <strong className="text-white">Tel:</strong> {editingEmp.phone}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={16} className="text-white" />
                    <strong className="text-white">Turno:</strong> {editingEmp.shift}
                  </span>
                </div>
                <div
                  className={`inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold shadow-sm ${statusColor(getStatus(editingEmp))}`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${statusDotColor(getStatus(editingEmp))}`} />
                  {getStatus(editingEmp)}
                </div>
              </div>
              <button
                onClick={() => setEditingId(null)}
                className="flex items-center justify-center rounded-full bg-white/20 p-1.5 text-white transition hover:bg-white/30"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  Status do Colaborador
                </label>
                <div className="relative">
                  <select
                    value={modalForm.status}
                    onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                  >
                    <option value="Automático">Automático (conforme horário)</option>
                    {availableStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="pointer-events-none absolute right-3 top-3.5 text-slate-400" />
                </div>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  Demandas Registradas
                </label>
                <textarea
                  value={modalForm.demandas}
                  onChange={(e) => setModalForm({ ...modalForm, demandas: e.target.value })}
                  className="min-h-[100px] w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                  placeholder="Descreva detalhadamente as demandas..."
                />
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  Situação Atual (Acompanhamento)
                </label>
                <textarea
                  value={modalForm.situacao}
                  onChange={(e) => setModalForm({ ...modalForm, situacao: e.target.value })}
                  className="min-h-[100px] w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                  placeholder="Informe o status ou observação atual..."
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveModal}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
                >
                  <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Colaborador */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleAddEmployee}
            className="w-full max-w-[420px] overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Adicionar Colaborador</h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-500 transition hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Nome Completo
                </label>
                <input
                  required
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-600">Telefone</label>
                <input
                  type="text"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500"
                  placeholder="Ex: 31 98888 8888"
                />
              </div>

              <div className="mb-6 flex gap-4">
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Início (HH:MM)
                  </label>
                  <input
                    required
                    type="time"
                    value={addForm.start}
                    onChange={(e) => setAddForm({ ...addForm, start: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Fim (HH:MM)
                  </label>
                  <input
                    required
                    type="time"
                    value={addForm.end}
                    onChange={(e) => setAddForm({ ...addForm, end: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-emerald-500 py-3 font-semibold text-white transition hover:bg-emerald-600"
              >
                Cadastrar na Base
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
