document.addEventListener('DOMContentLoaded', () => {
    let dados = {
        imoveis: [], clientes: [], reservas: [], despesas: [],
        checklistTemplates: [], tarefasAtivas: []
    };
    let calendario;
    let charts = {};

    const DOMElements = {
        pageTitle: document.getElementById('page-title'),
        menuLinks: document.querySelectorAll('.sidebar a'),
        sections: document.querySelectorAll('.content-body section'),
        mobileMenuToggle: document.querySelector('.mobile-menu-toggle'),
        sidebar: document.querySelector('.sidebar'),
        balancoMensalEl: document.getElementById("balanco-mensal"),
        taxaOcupacaoEl: document.getElementById("taxa-ocupacao"),
        receitaMensalEl: document.getElementById("receita-mensal"),
        custosMensalEl: document.getElementById("custos-mensal"),
        statusReservasContainer: document.getElementById('status-reservas-container'),
        formImovel: document.getElementById('form-imovel'),
        formReserva: document.getElementById("form-reserva"),
        formCliente: document.getElementById("form-cliente"),
        formChecklistModelo: document.getElementById('form-checklist-modelo'),
        formDespesa: document.getElementById("form-despesa"),
        tabelaReservasBody: document.querySelector("#tabela-reservas-body"),
        tabelaDespesasBody: document.getElementById("tabela-despesas-body"),
        cardsImoveisContainer: document.getElementById('cards-imoveis-grid'),
        cardsClientesContainer: document.getElementById("cards-clientes-grid"),
        confirmacaoModal: document.getElementById('confirmacao-reserva-modal'),
        checklistModal: document.getElementById('checklist-modal'),
        successToast: document.getElementById('success-toast'),
        calendarioContainer: document.getElementById("calendario-container"),
        balancoChartCtx: document.getElementById("balancoChart")?.getContext("2d"),
        receitaPorImovelChartCtx: document.getElementById("receitaPorImovelChart")?.getContext("2d"),
    };

    const salvarDados = () => { try { localStorage.setItem("myHostVinniDados", JSON.stringify(dados)); } catch (e) { console.error("Falha ao salvar dados:", e); } };
    const formatarMoeda = valor => (valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const criarEmptyState = (icon, title, message) => `<div class="empty-state" style="padding: 2rem;"><i class="fas fa-${icon}" style="font-size: 2rem; margin-bottom: 1rem;"></i><h3>${title}</h3><p>${message}</p></div>`;
    
    function mostrarNotificacao(mensagem, tipo = 'success') {
        DOMElements.successToast.textContent = mensagem;
        DOMElements.successToast.className = `toast show ${tipo}`;
        setTimeout(() => DOMElements.successToast.classList.remove('show'), 3000);
    }

    function carregarDados() {
        const dadosSalvos = localStorage.getItem("myHostVinniDados");
        if (dadosSalvos) {
            try {
                const dadosParseados = JSON.parse(dadosSalvos);
                if (dadosParseados && dadosParseados.imoveis) {
                    dados = { ...{imoveis: [], clientes: [], reservas: [], despesas: [], checklistTemplates: [], tarefasAtivas: []}, ...dadosParseados };
                    return;
                }
            } catch (e) { console.error("Falha ao carregar dados salvos.", e); }
        }
        gerarDadosIniciais();
    }

    function gerarDadosIniciais() {
        console.log("Nenhum dado encontrado. Gerando dados de exemplo...");
        const hoje = new Date();
        dados.imoveis = [
            { id: 1, nome: 'Flat em Boa Viagem', cor: '#22D3EE', condominio: 450, custoFixo: 150, wifi: 'praia123' },
            { id: 2, nome: 'Loft no Recife Antigo', cor: '#F43F5E', condominio: 300, custoFixo: 100, wifi: 'frevo2025' },
            { id: 3, nome: 'Casa em Porto de Galinhas', cor: '#34D399', condominio: 600, custoFixo: 250, wifi: 'veraoPG' }
        ];
        dados.clientes = [
            { id: 101, nome: 'João', sobrenome: 'Silva', cidade: 'Recife, PE', telefone: '81911112222' },
            { id: 102, nome: 'Maria', sobrenome: 'Oliveira', cidade: 'Olinda, PE', telefone: '81933334444' }
        ];
        dados.reservas = [
            { id: 1001, imovel: 'Flat em Boa Viagem', clienteId: 101, start: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 3, 14, 0).toISOString(), end: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 5, 11, 0).toISOString(), status: 'Pago', valorTotal: 1600, taxaPlataforma: 15, limpeza: 150, valorLiquido: 1210 },
            { id: 1002, imovel: 'Loft no Recife Antigo', clienteId: 102, start: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 10, 15, 0).toISOString(), end: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 15, 12, 0).toISOString(), status: 'A Receber', valorTotal: 1250, taxaPlataforma: 0, limpeza: 120, valorLiquido: 1130 },
        ];
        dados.despesas = [
            {id: 2001, imovel: 'Flat em Boa Viagem', data: new Date(hoje.getFullYear(), hoje.getMonth(), 5).toISOString().slice(0,10), valor: 180.50, categoria: 'Luz', descricao: 'CELPE ref 07/2025'}
        ];
        dados.checklistTemplates = [
            { idImovel: 1, tarefas: ["Verificar toalhas limpas", "Retirar lixo", "Verificar ar-condicionado"] }
        ];
        salvarDados();
    }
    
    function inicializarApp() {
        carregarDados();
        adicionarListenersDeEventos();
        inicializarComponentesExternos();
        atualizarUICompleta();
        setInterval(atualizarContadoresDashboard, 60000);
    }

    function adicionarListenersDeEventos() {
        DOMElements.menuLinks.forEach(link => link.addEventListener("click", navegarPara));
        DOMElements.mobileMenuToggle?.addEventListener('click', () => DOMElements.sidebar.classList.toggle('open'));
        DOMElements.confirmacaoModal.querySelector('#btn-cancelar-modal').addEventListener('click', () => DOMElements.confirmacaoModal.classList.add('hidden'));
        DOMElements.confirmacaoModal.querySelector('#btn-confirmar-reserva').addEventListener('click', salvarReservaConfirmada);
        DOMElements.checklistModal.querySelector('#btn-fechar-checklist-modal').addEventListener('click', () => DOMElements.checklistModal.classList.add('hidden'));
        DOMElements.formReserva.addEventListener("submit", handleFormReservaSubmit);
        DOMElements.formImovel.addEventListener("submit", handleFormImovelSubmit);
        DOMElements.formCliente.addEventListener("submit", handleFormClienteSubmit);
        DOMElements.formChecklistModelo.addEventListener("submit", handleFormChecklistSubmit);
        DOMElements.formDespesa.addEventListener("submit", handleFormDespesaSubmit);
        DOMElements.tabelaReservasBody.addEventListener("click", handleAcoesTabelaReservas);
        DOMElements.cardsImoveisContainer.addEventListener("click", handleAcoesImovel);
        DOMElements.cardsClientesContainer.addEventListener("click", handleAcoesCliente);
        DOMElements.tabelaDespesasBody.addEventListener("click", handleAcoesTabelaDespesas);
        DOMElements.formImovel.querySelector("#btn-cancelar-edicao-imovel").addEventListener("click", cancelarEdicaoImovel);
        DOMElements.formCliente.querySelector("#btn-cancelar-edicao-cliente").addEventListener("click", cancelarEdicaoCliente);
        DOMElements.formReserva.querySelector("#btn-cancelar-edicao-reserva").addEventListener("click", cancelarEdicaoReserva);
        DOMElements.formDespesa.querySelector("#btn-cancelar-edicao-despesa").addEventListener("click", cancelarEdicaoDespesa);
    }
    
    function inicializarComponentesExternos() {
        flatpickr.localize(flatpickr.l10ns.pt);
        flatpickr("#data_checkin", { dateFormat: "Y-m-d" });
        flatpickr("#data_checkout", { dateFormat: "Y-m-d" });
        flatpickr("#despesa-data", { dateFormat: "Y-m-d" });
        calendario = new FullCalendar.Calendar(DOMElements.calendarioContainer, { initialView: "dayGridMonth", locale: "pt-br", headerToolbar: { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,listWeek" }, buttonText: { today: "Hoje", month: "Mês", week: "Semana", list: "Lista" }, events: [] });
    }

    function navegarPara(evento) {
        evento.preventDefault();
        const link = evento.currentTarget;
        const targetId = link.getAttribute("href").substring(1);
        DOMElements.sections.forEach(section => section.classList.add("hidden"));
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.classList.remove("hidden");
        DOMElements.menuLinks.forEach(l => l.parentElement.classList.remove("active"));
        link.parentElement.classList.add("active");
        DOMElements.pageTitle.textContent = link.dataset.title || "Dashboard";
        if (targetId === "calendario-view" && calendario) { setTimeout(() => calendario.render(), 10); }
        if (targetId === "relatorios") { atualizarGraficos(); }
    }
    
    function handleExcluirItem(itemId, tipoDados) {
        if (confirm(`Tem certeza que deseja excluir este item de ${tipoDados}?`)) {
            dados[tipoDados] = dados[tipoDados].filter(item => item.id !== itemId);
            salvarDados();
            atualizarUICompleta();
            mostrarNotificacao("Item excluído.");
        }
    }

    function isPeriodoDisponivel(imovel, checkin, checkout, reservaIdAEditar = null) {
        const novoInicio = new Date(checkin);
        const novoFim = new Date(checkout);
        return !dados.reservas.some(reserva => {
            if (reserva.status === 'Cancelado' || reserva.id == reservaIdAEditar) return false;
            if (reserva.imovel === imovel) {
                const inicioExistente = new Date(reserva.start);
                const fimExistente = new Date(reserva.end);
                return novoInicio < fimExistente && novoFim > inicioExistente;
            }
            return false;
        });
    }

    function handleFormReservaSubmit(evento) {
        evento.preventDefault();
        const form = DOMElements.formReserva;
        const reservaId = form.querySelector("#reserva-id").value;
        const checkinDate = form.querySelector("#data_checkin").value, checkinTime = form.querySelector("#hora_checkin").value, checkoutDate = form.querySelector("#data_checkout").value, checkoutTime = form.querySelector("#hora_checkout").value;
        if (!checkinDate || !checkoutDate || !checkinTime || !checkoutTime) { mostrarNotificacao("Por favor, preencha todas as datas e horas.", "error"); return; }
        const start = `${checkinDate}T${checkinTime}`, end = `${checkoutDate}T${checkoutTime}`;
        const imovel = form.querySelector("#imovel").value;
        if (new Date(start) >= new Date(end)) { mostrarNotificacao("A data de check-out deve ser posterior à de check-in.", "error"); return; }
        if (!isPeriodoDisponivel(imovel, start, end, reservaId ? parseInt(reservaId) : null)) { mostrarNotificacao("Conflito de datas! Imóvel já reservado.", "error"); return; }
        const clienteId = parseInt(form.querySelector("#cliente").value);
        const cliente = dados.clientes.find(c => c.id === clienteId);
        const valorTotal = parseFloat(form.querySelector("#valor_total").value) || 0, taxaPlataforma = parseFloat(form.querySelector("#taxa_plataforma").value) || 0, limpeza = parseFloat(form.querySelector("#limpeza").value) || 0;
        const reservaData = { id: reservaId ? parseInt(reservaId) : null, imovel, clienteId, start, end, hospedes: parseInt(form.querySelector("#hospedes").value), plataforma: form.querySelector("#plataforma_reserva").value, status: form.querySelector("#status").value, valorTotal, taxaPlataforma, limpeza, valorLiquido: valorTotal * (1 - taxaPlataforma / 100) - limpeza };
        const inicio = new Date(start), fim = new Date(end);
        const noites = Math.ceil((fim - inicio) / 864e5);
        DOMElements.modalBody.innerHTML = `<p>Você está prestes a ${reservaData.id ? 'atualizar a' : 'criar uma'} reserva para <strong>${cliente?.nome || ''} ${cliente?.sobrenome || ''}</strong> no imóvel <strong>${imovel}</strong>.</p><p><strong>Check-in:</strong> ${inicio.toLocaleString('pt-BR')}</p><p><strong>Check-out:</strong> ${fim.toLocaleString('pt-BR')}</p><div class="detalhe-dias">A reserva terá a duração de <strong>${noites > 0 ? noites : 1} noite(s)</strong>.</div>`;
        DOMElements.confirmacaoModal.reservaData = reservaData;
        DOMElements.confirmacaoModal.classList.remove('hidden');
    }

    function salvarReservaConfirmada() {
        DOMElements.btnConfirmarReserva.disabled = true;
        const reservaData = DOMElements.confirmacaoModal.reservaData;
        if (!reservaData) {
            mostrarNotificacao("Erro ao salvar.", "error");
            DOMElements.btnConfirmarReserva.disabled = false;
            DOMElements.confirmacaoModal.classList.add('hidden');
            return;
        }
        if (reservaData.id) {
            const index = dados.reservas.findIndex(r => r.id === reservaData.id);
            if (index > -1) dados.reservas[index] = { ...dados.reservas[index], ...reservaData };
        } else {
            dados.reservas.push({ ...reservaData, id: Date.now() });
        }
        salvarDados();
        DOMElements.confirmacaoModal.classList.add('hidden');
        mostrarNotificacao(`Reserva ${reservaData.id ? 'atualizada' : 'salva'} com sucesso!`);
        cancelarEdicaoReserva();
        atualizarUICompleta();
        setTimeout(() => { DOMElements.btnConfirmarReserva.disabled = false; }, 500);
    }

    function handleAcoesTabelaReservas(evento) {
        const button = evento.target.closest("[data-action]");
        if (button) {
            const reservaId = parseInt(button.closest("tr").dataset.id);
            const action = button.dataset.action;
            if (action === "editar") editarReserva(reservaId);
            if (action === "excluir") handleExcluirItem(reservaId, "reservas");
            if (action === "gerar-checklist") handleGerarChecklist(reservaId);
            if (action === "ver-checklist") abrirModalChecklist(reservaId);
        }
    }
    
    function editarReserva(reservaId) {
        const reserva = dados.reservas.find(r => r.id == reservaId);
        if (reserva) {
            const form = DOMElements.formReserva;
            form.querySelector("#reserva-id").value = reserva.id;
            form.querySelector("#imovel").value = reserva.imovel;
            form.querySelector("#cliente").value = reserva.clienteId;
            const inicio = new Date(reserva.start), fim = new Date(reserva.end);
            form.querySelector("#data_checkin")._flatpickr.setDate(inicio);
            form.querySelector("#hora_checkin").value = inicio.toTimeString().slice(0, 5);
            form.querySelector("#data_checkout")._flatpickr.setDate(fim);
            form.querySelector("#hora_checkout").value = fim.toTimeString().slice(0, 5);
            form.querySelector("#hospedes").value = reserva.hospedes;
            form.querySelector("#plataforma_reserva").value = reserva.plataforma;
            form.querySelector("#valor_total").value = reserva.valorTotal;
            form.querySelector("#taxa_plataforma").value = reserva.taxaPlataforma;
            form.querySelector("#limpeza").value = reserva.limpeza;
            form.querySelector("#status").value = reserva.status;
            form.querySelector("#form-reserva-titulo").textContent = "Editando Reserva";
            form.querySelector("#btn-reserva-texto").textContent = "Salvar Alterações";
            form.querySelector("#btn-cancelar-edicao-reserva").classList.remove("hidden");
            form.scrollIntoView({ behavior: "smooth" });
        }
    }

    function cancelarEdicaoReserva() {
        const form = DOMElements.formReserva;
        form.reset();
        form.querySelector("#reserva-id").value = "";
        form.querySelector("#form-reserva-titulo").textContent = "Adicionar Nova Reserva";
        form.querySelector("#btn-reserva-texto").textContent = "Verificar e Adicionar";
        form.querySelector("#btn-cancelar-edicao-reserva").classList.add("hidden");
    }

    function handleFormImovelSubmit(evento) {
        evento.preventDefault();
        const form = DOMElements.formImovel;
        const imovelId = form.querySelector("#imovel-id").value;
        const imovelData = { nome: form.querySelector("#imovel-nome").value, cor: form.querySelector("#imovel-cor").value, condominio: parseFloat(form.querySelector("#imovel-condominio").value) || 0, custoFixo: parseFloat(form.querySelector("#imovel-custo-fixo").value) || 0, wifi: form.querySelector("#imovel-wifi").value };
        if (imovelId) {
            const index = dados.imoveis.findIndex(i => i.id == imovelId);
            if (index > -1) dados.imoveis[index] = { ...dados.imoveis[index], ...imovelData, id: parseInt(imovelId) };
        } else {
            dados.imoveis.push({ id: Date.now(), ...imovelData });
        }
        salvarDados();
        atualizarUICompleta();
        cancelarEdicaoImovel();
        mostrarNotificacao(`Imóvel ${imovelId ? 'atualizado' : 'salvo'} com sucesso!`);
    }
    
    function editarImovel(imovelId) {
        const imovel = dados.imoveis.find(i => i.id == imovelId);
        if (imovel) {
            const form = DOMElements.formImovel;
            form.querySelector("#imovel-id").value = imovel.id;
            form.querySelector("#imovel-nome").value = imovel.nome;
            form.querySelector("#imovel-cor").value = imovel.cor;
            form.querySelector("#imovel-condominio").value = imovel.condominio;
            form.querySelector("#imovel-custo-fixo").value = imovel.custoFixo;
            form.querySelector("#imovel-wifi").value = imovel.wifi;
            form.querySelector("#form-imovel-titulo").textContent = `Editando: ${imovel.nome}`;
            form.querySelector("#btn-imovel-texto").textContent = "Salvar Alterações";
            form.querySelector("#btn-cancelar-edicao-imovel").classList.remove("hidden");
            form.scrollIntoView({ behavior: "smooth" });
        }
    }

    function cancelarEdicaoImovel() {
        const form = DOMElements.formImovel;
        form.reset();
        form.querySelector("#imovel-id").value = "";
        form.querySelector("#form-imovel-titulo").textContent = "Cadastrar Novo Imóvel";
        form.querySelector("#btn-imovel-texto").textContent = "Salvar Imóvel";
        form.querySelector("#btn-cancelar-edicao-imovel").classList.add("hidden");
    }

    function handleAcoesImovel(evento) {
        const button = evento.target.closest(".action-btn");
        if (button?.dataset.action) {
            const { action, id } = button.dataset;
            if (action === "editar") editarImovel(parseInt(id));
            if (action === "excluir") handleExcluirItem(parseInt(id), "imoveis");
        }
    }

    function handleFormClienteSubmit(evento) {
        evento.preventDefault();
        const form = DOMElements.formCliente;
        const clienteId = form.querySelector("#cliente-id").value;
        const clienteData = { nome: form.querySelector("#cliente-nome").value, sobrenome: form.querySelector("#cliente-sobrenome").value, telefone: form.querySelector("#cliente-telefone").value, cidade: form.querySelector("#cliente-cidade").value };
        if (clienteId) {
            const index = dados.clientes.findIndex(c => c.id == clienteId);
            if(index > -1) dados.clientes[index] = {...dados.clientes[index], ...clienteData, id: parseInt(clienteId)};
        } else {
            dados.clientes.push({ id: Date.now(), ...clienteData });
        }
        salvarDados();
        atualizarUICompleta();
        cancelarEdicaoCliente();
        mostrarNotificacao(`Cliente ${clienteId ? 'atualizado' : 'adicionado'} com sucesso!`);
    }
    
    function editarCliente(clienteId) {
        const cliente = dados.clientes.find(c => c.id == clienteId);
        if (cliente) {
            const form = DOMElements.formCliente;
            form.querySelector("#cliente-id").value = cliente.id;
            form.querySelector("#cliente-nome").value = cliente.nome;
            form.querySelector("#cliente-sobrenome").value = cliente.sobrenome;
            form.querySelector("#cliente-telefone").value = cliente.telefone;
            form.querySelector("#cliente-cidade").value = cliente.cidade;
            form.querySelector("#form-cliente-titulo").textContent = `Editando: ${cliente.nome}`;
            form.querySelector("#btn-cliente-texto").textContent = "Salvar Alterações";
            form.querySelector("#btn-cancelar-edicao-cliente").classList.remove("hidden");
            form.scrollIntoView({ behavior: "smooth" });
        }
    }
    
    function cancelarEdicaoCliente() {
        const form = DOMElements.formCliente;
        form.reset();
        form.querySelector("#cliente-id").value = "";
        form.querySelector("#form-cliente-titulo").textContent = "Adicionar Novo Cliente";
        form.querySelector("#btn-cliente-texto").textContent = "Adicionar Cliente";
        form.querySelector("#btn-cancelar-edicao-cliente").classList.add("hidden");
    }

    function handleAcoesCliente(evento) {
        const button = evento.target.closest(".action-btn");
        if (button?.dataset.action) {
            const { action, id } = button.dataset;
            if (action === "editar") editarCliente(parseInt(id));
            if (action === "excluir") handleExcluirItem(parseInt(id), "clientes");
        }
    }
    
    function handleFormDespesaSubmit(evento) {
        evento.preventDefault();
        const form = DOMElements.formDespesa;
        const despesaId = form.querySelector("#despesa-id").value;
        const despesaData = {
            imovel: form.querySelector("#despesa-imovel").value,
            data: form.querySelector("#despesa-data").value,
            valor: parseFloat(form.querySelector("#despesa-valor").value) || 0,
            categoria: form.querySelector("#despesa-categoria").value,
            descricao: form.querySelector("#despesa-descricao").value,
        };
        if (!despesaData.data || !despesaData.imovel) {
            mostrarNotificacao("Preencha o imóvel e a data da despesa.", "error");
            return;
        }
        if (despesaId) {
            const index = dados.despesas.findIndex(d => d.id == despesaId);
            if(index > -1) dados.despesas[index] = {...dados.despesas[index], ...despesaData, id: parseInt(despesaId)};
        } else {
            dados.despesas.push({ id: Date.now(), ...despesaData });
        }
        salvarDados();
        atualizarUICompleta();
        cancelarEdicaoDespesa();
        mostrarNotificacao(`Despesa ${despesaId ? 'atualizada' : 'adicionada'} com sucesso!`);
    }

    function editarDespesa(despesaId) {
        const despesa = dados.despesas.find(d => d.id == despesaId);
        if (despesa) {
            const form = DOMElements.formDespesa;
            form.querySelector("#despesa-id").value = despesa.id;
            form.querySelector("#despesa-imovel").value = despesa.imovel;
            form.querySelector("#despesa-data")._flatpickr.setDate(despesa.data);
            form.querySelector("#despesa-valor").value = despesa.valor;
            form.querySelector("#despesa-categoria").value = despesa.categoria;
            form.querySelector("#despesa-descricao").value = despesa.descricao;
            form.querySelector("#form-despesa-titulo").textContent = "Editando Despesa";
            form.querySelector("#btn-despesa-texto").textContent = "Salvar Alterações";
            form.querySelector("#btn-cancelar-edicao-despesa").classList.remove("hidden");
            form.scrollIntoView({ behavior: "smooth" });
        }
    }

    function cancelarEdicaoDespesa() {
        const form = DOMElements.formDespesa;
        form.reset();
        form.querySelector("#despesa-id").value = "";
        form.querySelector("#form-despesa-titulo").textContent = "Adicionar Nova Despesa";
        form.querySelector("#btn-despesa-texto").textContent = "Adicionar Despesa";
        form.querySelector("#btn-cancelar-edicao-despesa").classList.add("hidden");
    }

    function handleAcoesTabelaDespesas(evento) {
        const button = evento.target.closest(".action-btn");
        if (button?.dataset.action) {
            const { action, id } = button.dataset;
            if (action === "editar") editarDespesa(parseInt(id));
            if (action === "excluir") handleExcluirItem(parseInt(id), "despesas");
        }
    }
    
    function handleFormChecklistSubmit(evento) {
        evento.preventDefault();
        const form = DOMElements.formChecklistModelo;
        const imovelId = form.querySelector("#checklist-modelo-imovel").value;
        const tarefaTexto = form.querySelector("#checklist-modelo-tarefa").value.trim();

        if (!imovelId || !tarefaTexto) {
            mostrarNotificacao("Selecione um imóvel e digite uma tarefa.", "error");
            return;
        }
        let template = dados.checklistTemplates.find(t => t.idImovel == imovelId);
        if (template) {
            template.tarefas.push(tarefaTexto);
        } else {
            dados.checklistTemplates.push({ idImovel: parseInt(imovelId), tarefas: [tarefaTexto] });
        }
        salvarDados();
        atualizarUICompleta();
        form.querySelector("#checklist-modelo-tarefa").value = "";
        mostrarNotificacao("Tarefa adicionada ao modelo!");
    }

    function handleGerarChecklist(reservaId) {
        if (dados.tarefasAtivas.some(t => t.idReserva === reservaId)) {
            mostrarNotificacao("Checklist já existe para esta reserva.", "error");
            abrirModalChecklist(reservaId);
            return;
        }
        const reserva = dados.reservas.find(r => r.id === reservaId);
        const imovel = dados.imoveis.find(i => i.nome === reserva.imovel);
        const template = dados.checklistTemplates.find(t => t.idImovel == imovel.id);

        if (!template || template.tarefas.length === 0) {
            mostrarNotificacao(`Nenhum modelo de checklist encontrado para ${imovel.nome}. Crie um na aba Checklists.`, "error");
            return;
        }

        const novoChecklist = {
            id: Date.now(),
            idReserva: reservaId,
            tarefas: template.tarefas.map(texto => ({ texto, completa: false }))
        };
        dados.tarefasAtivas.push(novoChecklist);
        salvarDados();
        atualizarUICompleta();
        mostrarNotificacao(`Checklist para ${imovel.nome} gerado com sucesso!`);
        abrirModalChecklist(reservaId);
    }
    
    function abrirModalChecklist(reservaId) {
        const checklist = dados.tarefasAtivas.find(t => t.idReserva === reservaId);
        const reserva = dados.reservas.find(r => r.id === reservaId);
        const modal = DOMElements.checklistModal;
        const modalTitulo = modal.querySelector('#checklist-modal-titulo');
        const modalBody = modal.querySelector('#checklist-modal-body');
        const btnApagar = modal.querySelector('#btn-apagar-checklist');

        modalTitulo.textContent = `Checklist: ${reserva.imovel}`;
        
        const tarefasHtml = checklist.tarefas.map((tarefa, index) => `
            <li class="post-it-task" data-checklist-id="${checklist.id}" data-tarefa-index="${index}">
                <label class="${tarefa.completa ? 'completed' : ''}">
                    <input type="checkbox" ${tarefa.completa ? 'checked' : ''}>
                    <span>${tarefa.texto}</span>
                </label>
            </li>
        `).join('');
        modalBody.innerHTML = `<ul>${tarefasHtml}</ul>`;

        const newBtnApagar = btnApagar.cloneNode(true);
        btnApagar.parentNode.replaceChild(newBtnApagar, btnApagar);
        
        newBtnApagar.addEventListener('click', () => {
            if (confirm("Tem certeza que deseja apagar este checklist ativo?")) {
                dados.tarefasAtivas = dados.tarefasAtivas.filter(t => t.id !== checklist.id);
                salvarDados();
                atualizarUICompleta();
                modal.classList.add('hidden');
                mostrarNotificacao("Checklist apagado.");
            }
        });

        modalBody.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (evento) => {
                const listItem = evento.target.closest('.post-it-task');
                const checklistId = parseInt(listItem.dataset.checklistId);
                const tarefaIndex = parseInt(listItem.dataset.tarefaIndex);
                const isCompleta = evento.target.checked;
                const chk = dados.tarefasAtivas.find(t => t.id === checklistId);
                if (chk && chk.tarefas[tarefaIndex]) {
                    chk.tarefas[tarefaIndex].completa = isCompleta;
                    evento.target.closest('label').classList.toggle('completed', isCompleta);
                    salvarDados();
                }
            });
        });

        modal.classList.remove('hidden');
    }
    
    function atualizarUICompleta() {
        const funcoesDeRender = { popularDropdowns, renderizarTabelaReservas, renderizarStatusReservas, renderizarImoveis, renderizarClientes, renderizarTabelaDespesas, renderizarModelosChecklist, atualizarKPIsDashboard, renderizarCalendario };
        for (const nomeFuncao in funcoesDeRender) {
            try { funcoesDeRender[nomeFuncao](); } catch (error) { console.error(`ERRO ao renderizar '${nomeFuncao}':`, error); }
        }
    }

    function popularDropdowns() {
        const imovelReservaSelect = DOMElements.formReserva.querySelector("#imovel");
        const clienteReservaSelect = DOMElements.formReserva.querySelector("#cliente");
        const checklistImovelSelect = DOMElements.formChecklistModelo.querySelector("#checklist-modelo-imovel");
        const despesaImovelSelect = DOMElements.formDespesa.querySelector("#despesa-imovel");
        [imovelReservaSelect, clienteReservaSelect, checklistImovelSelect, despesaImovelSelect].forEach(s => { if(s) s.innerHTML = ""; });
        dados.imoveis.forEach(imovel => {
            imovelReservaSelect?.add(new Option(imovel.nome, imovel.nome));
            checklistImovelSelect?.add(new Option(imovel.nome, imovel.id.toString()));
            despesaImovelSelect?.add(new Option(imovel.nome, imovel.nome));
        });
        dados.clientes.forEach(cliente => {
            clienteReservaSelect?.add(new Option(`${cliente.nome} ${cliente.sobrenome}`, cliente.id.toString()));
        });
    }

    function renderizarTabelaReservas() {
        const tabelaBody = DOMElements.tabelaReservasBody;
        tabelaBody.innerHTML = "";
        if (!dados.reservas || dados.reservas.length === 0) {
            tabelaBody.innerHTML = `<tr><td colspan="8">${criarEmptyState("calendar-times", "Nenhuma reserva encontrada", "Crie sua primeira reserva.")}</td></tr>`;
            return;
        }
        const reservasOrdenadas = [...dados.reservas].sort((a, b) => (new Date(b.start).getTime() || 0) - (new Date(a.start).getTime() || 0));
        reservasOrdenadas.forEach(reserva => {
            try {
                const cliente = dados.clientes.find(c => c.id === reserva.clienteId);
                const dataInicio = new Date(reserva.start);
                const isDataValida = !isNaN(dataInicio.getTime());
                const noites = isDataValida ? Math.ceil((new Date(reserva.end) - dataInicio) / 864e5) : 0;
                const periodoStr = isDataValida ? dataInicio.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Data inválida";
                const checklistAtivo = dados.tarefasAtivas.find(t => t.idReserva === reserva.id);
                const checklistHtml = checklistAtivo
                    ? `<i class="fas fa-clipboard-check checklist-status-icon criado" data-action="ver-checklist" title="Ver/Editar Checklist"></i>`
                    : `<i class="fas fa-clipboard-list checklist-status-icon nao-criado" data-action="gerar-checklist" title="Gerar Checklist"></i>`;
                const newRow = document.createElement("tr");
                newRow.dataset.id = reserva.id;
                newRow.innerHTML = `
                    <td>${cliente ? `${cliente.nome} ${cliente.sobrenome}` : "Cliente removido"}</td>
                    <td>${reserva.imovel || "N/A"}</td>
                    <td>${periodoStr}</td>
                    <td>${noites > 0 ? noites : 1}</td>
                    <td><span class="status status-${(reserva.status || 'default').toLowerCase().replace(" ", "-")}">${reserva.status || "N/A"}</span></td>
                    <td style="text-align: center;">${checklistHtml}</td>
                    <td>${formatarMoeda(reserva.valorLiquido)}</td>
                    <td class="acoes-reserva">
                        <button class="action-btn" data-action="editar" title="Editar Reserva"><i class="fas fa-pencil-alt"></i></button>
                        <button class="action-btn delete" data-action="excluir" title="Excluir Reserva"><i class="fas fa-trash-alt"></i></button>
                    </td>`;
                tabelaBody.appendChild(newRow);
            } catch (error) { console.error(`Falha ao renderizar a reserva ID: ${reserva?.id}`, error); }
        });
    }
    
    function renderizarTabelaDespesas() {
        const tabelaBody = DOMElements.tabelaDespesasBody;
        if (!tabelaBody) return;
        tabelaBody.innerHTML = "";
        if (!dados.despesas || dados.despesas.length === 0) {
            tabelaBody.innerHTML = `<tr><td colspan="6">${criarEmptyState("receipt", "Nenhuma despesa encontrada", "Adicione sua primeira despesa.")}</td></tr>`;
            return;
        }
        const despesasOrdenadas = [...dados.despesas].sort((a, b) => new Date(b.data) - new Date(a.data));
        despesasOrdenadas.forEach(despesa => {
            const newRow = document.createElement("tr");
            newRow.dataset.id = despesa.id;
            newRow.innerHTML = `
                <td>${new Date(despesa.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                <td>${despesa.imovel}</td>
                <td>${despesa.categoria}</td>
                <td>${despesa.descricao}</td>
                <td>${formatarMoeda(despesa.valor)}</td>
                <td class="acoes-reserva">
                    <button class="action-btn" data-action="editar" title="Editar Despesa"><i class="fas fa-pencil-alt"></i></button>
                    <button class="action-btn delete" data-action="excluir" title="Excluir Despesa"><i class="fas fa-trash-alt"></i></button>
                </td>`;
            tabelaBody.appendChild(newRow);
        });
    }
    
    function renderizarModelosChecklist() {
        const container = document.getElementById("modelos-checklist-container");
        if (!container) return;
        container.innerHTML = "<h4>Modelos Salvos</h4>";
        if (!dados.checklistTemplates || dados.checklistTemplates.length === 0) {
            container.innerHTML += "<p>Nenhum modelo de checklist criado ainda.</p>";
            return;
        }
        dados.imoveis.forEach(imovel => {
            const template = dados.checklistTemplates.find(t => t.idImovel == imovel.id);
            if (template && template.tarefas.length > 0) {
                const tarefasHtml = template.tarefas.map(tarefa => `<li>- ${tarefa}</li>`).join('');
                container.innerHTML += `<div class="modelo-item"> <h5>${imovel.nome}</h5> <ul style="list-style: none; padding: 0;">${tarefasHtml}</ul> </div>`;
            }
        });
    }

    function renderizarStatusReservas() {
        const container = DOMElements.statusReservasContainer;
        if (!container) return;
        container.innerHTML = '';
        const agora = new Date();
        const reservasAtivas = dados.reservas.filter(r => r.status !== 'Cancelado' && new Date(r.end) > agora).sort((a, b) => new Date(a.end) - new Date(b.end));
        if (reservasAtivas.length === 0) { container.innerHTML = criarEmptyState("bed", "Nenhuma reserva ativa", "Não há check-outs para monitorar."); return; }
        const listaHtml = reservasAtivas.map(reserva => { const cliente = dados.clientes.find(c => c.id === reserva.clienteId); const tempoRestanteMs = new Date(reserva.end).getTime() - agora.getTime(); return `<li><div class="reserva-info"><span>${cliente ? cliente.nome : 'N/A'} em <strong>${reserva.imovel}</strong></span><span data-checkout-countdown="${reserva.end}">${formatarContagemRegressiva(tempoRestanteMs)}</span></div></li>`; }).join('');
        container.innerHTML = `<ul style="list-style:none; padding:0;">${listaHtml}</ul>`;
    }
    
    function formatarContagemRegressiva(ms) {
        if (ms <= 0) return '<span class="countdown finalizado">Finalizado</span>';
        const dias = Math.floor(ms / 864e5);
        const horas = Math.floor((ms % 864e5) / 36e5);
        let str = '<span class="countdown">';
        if (dias > 0) str += `${dias}d `;
        str += `${horas}h para o check-out</span>`;
        return str;
    }

    function renderizarImoveis() {
        const container = DOMElements.cardsImoveisContainer;
        container.innerHTML = '';
        if (!dados.imoveis || dados.imoveis.length === 0) { container.innerHTML = criarEmptyState("house-chimney-crack", "Nenhum imóvel cadastrado", "Adicione seu primeiro imóvel."); return; }
        dados.imoveis.forEach(imovel => {
            const card = document.createElement("div");
            card.className = "imovel-card";
            card.innerHTML = `<div class="card-header"> <h3 style="border-left: 4px solid ${imovel.cor}; padding-left: 0.75rem;">${imovel.nome}</h3> </div> <div class="card-body"> <p><i class="fas fa-building"></i> <strong>Condomínio:</strong> ${formatarMoeda(imovel.condominio)}</p> <p><i class="fas fa-dollar-sign"></i> <strong>Outros Custos:</strong> ${formatarMoeda(imovel.custoFixo)}</p> </div> <div class="card-footer"> <button class="action-btn" data-action="editar" data-id="${imovel.id}" title="Editar Imóvel"><i class="fas fa-pencil-alt"></i></button> <button class="action-btn delete" data-action="excluir" data-id="${imovel.id}" title="Excluir Imóvel"><i class="fas fa-trash-alt"></i></button> </div>`;
            container.appendChild(card);
        });
    }

    function renderizarClientes() {
        const container = DOMElements.cardsClientesContainer;
        container.innerHTML = '';
        if (!dados.clientes || dados.clientes.length === 0) { container.innerHTML = criarEmptyState("user-slash", "Nenhum cliente cadastrado", "Adicione clientes no formulário."); return; }
        dados.clientes.forEach(cliente => {
            const card = document.createElement("div");
            card.className = "client-card";
            card.innerHTML = `<div class="card-header"> <h3>${cliente.nome} ${cliente.sobrenome}</h3> </div> <div class="card-body"> <p><i class="fas fa-map-marker-alt"></i> ${cliente.cidade || 'Não informada'}</p> <p><i class="fas fa-phone"></i> ${cliente.telefone || 'Não informado'}</p> </div> <div class="card-footer"> <button class="action-btn" data-action="editar" data-id="${cliente.id}" title="Editar Cliente"><i class="fas fa-pencil-alt"></i></button> <button class="action-btn delete" data-action="excluir" data-id="${cliente.id}" title="Excluir Cliente"><i class="fas fa-trash-alt"></i></button> </div>`;
            container.appendChild(card);
        });
    }
    
    function atualizarKPIsDashboard() {
        const hoje = new Date(), mesAtual = hoje.getMonth(), anoAtual = hoje.getFullYear();
        const receitaPagaMes = dados.reservas.filter(r => r.status === "Pago" && new Date(r.start).getMonth() === mesAtual && new Date(r.start).getFullYear() === anoAtual).reduce((total, r) => total + r.valorLiquido, 0);
        const despesasVariaveisMes = dados.despesas.filter(d => new Date(d.data).getMonth() === mesAtual && new Date(d.data).getFullYear() === anoAtual).reduce((total, d) => total + d.valor, 0);
        const custosFixosTotais = dados.imoveis.reduce((total, i) => total + (i.condominio || 0) + (i.custoFixo || 0), 0);
        const custosTotaisMes = despesasVariaveisMes + custosFixosTotais;
        const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
        let diasOcupados = 0;
        if (dados.imoveis.length > 0) { dados.reservas.filter(r => r.status !== "Cancelado").forEach(r => { for (let dia = new Date(r.start); dia < new Date(r.end); dia.setDate(dia.getDate() + 1)) { if (dia.getMonth() === mesAtual && dia.getFullYear() === anoAtual) diasOcupados++; } }); }
        const totalDiasDisponiveis = diasNoMes * dados.imoveis.length;
        const taxaOcupacao = totalDiasDisponiveis > 0 ? (diasOcupados / totalDiasDisponiveis) * 100 : 0;
        DOMElements.balancoMensalEl.textContent = formatarMoeda(receitaPagaMes - custosTotaisMes);
        DOMElements.taxaOcupacaoEl.textContent = `${taxaOcupacao.toFixed(1)}%`;
        DOMElements.receitaMensalEl.textContent = formatarMoeda(receitaPagaMes);
        DOMElements.custosMensalEl.textContent = formatarMoeda(custosTotaisMes);
    }

    function atualizarContadoresDashboard() {
        const agora = new Date();
        document.querySelectorAll('[data-checkout-countdown]').forEach(el => {
            el.innerHTML = formatarContagemRegressiva(new Date(el.dataset.checkoutCountdown).getTime() - agora.getTime());
        });
    }

    async function renderizarCalendario() {
        if (!calendario) return;
        const coresImoveisMap = new Map(dados.imoveis.map(imovel => [imovel.nome, imovel.cor]));
        try {
            const feriadosResponse = await fetch(`https://brasilapi.com.br/api/feriados/v1/${new Date().getFullYear()}`);
            const feriados = feriadosResponse.ok ? await feriadosResponse.json() : [];
            const eventosFeriados = feriados.map(feriado => ({ title: feriado.name, start: feriado.date, allDay: true, display: 'background', color: '#4B5563' }));
            const eventosReservas = dados.reservas.filter(r => r.status !== 'Cancelado').map(reserva => { const cliente = dados.clientes.find(c => c.id === reserva.clienteId); return { id: reserva.id, title: `${cliente ? cliente.nome.split(" ")[0] : "Reserva"} @ ${reserva.imovel}`, start: reserva.start, end: reserva.end, backgroundColor: coresImoveisMap.get(reserva.imovel) || '#6B7280', borderColor: coresImoveisMap.get(reserva.imovel) || '#6B7280' }; });
            calendario.removeAllEvents();
            calendario.addEventSource(eventosReservas);
            calendario.addEventSource(eventosFeriados);
        } catch(error) { console.error("Falha ao buscar feriados:", error); }
    }
    
    async function atualizarGraficos() {
        if (!DOMElements.balancoChartCtx) return;
        for (let key in charts) { if(charts[key]) charts[key].destroy(); }
        const labelsMeses = [...Array(6).keys()].map(i => { const d = new Date(); d.setMonth(d.getMonth() - i); return d.toLocaleString('pt-BR', {month: 'short'}); }).reverse();
        const receitaPorMes = labelsMeses.map((_, index) => { const date = new Date(); date.setMonth(date.getMonth() - (5 - index)); return dados.reservas.filter(r => r.status === 'Pago' && new Date(r.start).getMonth() === date.getMonth() && new Date(r.start).getFullYear() === date.getFullYear()).reduce((total, r) => total + r.valorLiquido, 0); });
        charts.balanco = new Chart(DOMElements.balancoChartCtx, { type: 'bar', data: { labels: labelsMeses, datasets: [{ label: "Receita", data: receitaPorMes, backgroundColor: '#22D3EE' }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#9CA3AF' } }, y: { ticks: { color: '#9CA3AF' } } } } });
        const receitaPorImovel = dados.imoveis.map(imovel => ({ nome: imovel.nome, cor: imovel.cor, total: dados.reservas.filter(r => r.imovel === imovel.nome && r.status === 'Pago').reduce((total, r) => total + r.valorLiquido, 0) }));
        charts.receita = new Chart(DOMElements.receitaPorImovelChartCtx, { type: 'doughnut', data: { labels: receitaPorImovel.map(i => i.nome), datasets: [{ data: receitaPorImovel.map(i => i.total), backgroundColor: receitaPorImovel.map(i => i.cor) }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#9CA3AF' } } } } });
    }
    

    inicializarApp();
});