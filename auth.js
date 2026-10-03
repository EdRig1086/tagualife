
/** Hash de senha (SHA-256 + salt) — usado no login e perfil */
async function hashSenhaTagua(senha) {
    const enc = new TextEncoder();
    const data = enc.encode('tagualife_v1_' + String(senha || ''));
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
window.hashSenhaTagua = hashSenhaTagua;

/** Verifica senha: aceita hash novo OU texto antigo (migração) */
async function verificarSenhaTagua(senhaDigitada, senhaHashBanco) {
    if (!senhaHashBanco) return false;
    if (senhaHashBanco === senhaDigitada) return true; // legado
    const h = await hashSenhaTagua(senhaDigitada);
    return h === senhaHashBanco;
}
window.verificarSenhaTagua = verificarSenhaTagua;

// auth.js - Sessão, permissões e multi-cliente (condomínio)
const PERMISSOES = {
    Administrador: {
        cadastrar: true, editar: true, excluir: true, verTudo: true,
        gerenciarUsuarios: true, aprovarCotacoes: true
    },
    Síndico: {
        cadastrar: true, editar: true, excluir: false, verTudo: true,
        gerenciarUsuarios: false, aprovarCotacoes: true
    },
    Síndica: {
        cadastrar: true, editar: true, excluir: false, verTudo: true,
        gerenciarUsuarios: false, aprovarCotacoes: true
    },
    Almoxarife: {
        cadastrar: true, editar: true, excluir: false, verTudo: false,
        gerenciarUsuarios: false, aprovarCotacoes: false
    },
    Manutenção: {
        cadastrar: false, editar: false, excluir: false, verTudo: false,
        gerenciarUsuarios: false, aprovarCotacoes: false
    },
    Porteiro: {
        cadastrar: false, editar: false, excluir: false, verTudo: false,
        gerenciarUsuarios: false, aprovarCotacoes: false
    },
    Zelador: {
        cadastrar: false, editar: false, excluir: false, verTudo: false,
        gerenciarUsuarios: false, aprovarCotacoes: false
    },
    Usuário: {
        cadastrar: false, editar: false, excluir: false, verTudo: false,
        gerenciarUsuarios: false, aprovarCotacoes: false
    }
};

function getSessao() {
    try {
        const raw = localStorage.getItem('tagualife_sessao');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function estaLogado() {
    return !!getSessao();
}

function getCargo() {
    const s = getSessao();
    return (s && s.cargo) ? s.cargo : 'Usuário';
}

/** ID do condomínio do usuário logado (isolamento multi-cliente) */
function getCondominioId() {
    const s = getSessao();
    return (s && s.condominio_id) ? s.condominio_id : null;
}

function getCondominioNome() {
    const s = getSessao();
    return (s && s.condominio_nome) ? s.condominio_nome : '';
}

/**
 * Aplica filtro de condomínio em uma query Supabase.
 * Uso: let q = sb.from('estoque').select('*'); q = comCondominio(q); 
 */
function comCondominio(query) {
    const id = getCondominioId();
    if (id) return query.eq('condominio_id', id);
    return query;
}

/** Payload padrão para INSERT com condomínio */
function payloadComCondominio(obj) {
    const id = getCondominioId();
    const base = obj || {};
    if (id) base.condominio_id = id;
    return base;
}

function temPermissao(acao) {
    const cargo = getCargo();
    const p = PERMISSOES[cargo] || PERMISSOES['Usuário'];
    return !!(p && p[acao]);
}

function podeCadastrar() { return temPermissao('cadastrar'); }
function podeEditar() { return temPermissao('editar'); }
function podeExcluir() { return temPermissao('excluir'); }
function podeVerTudo() { return temPermissao('verTudo'); }
function podeGerenciarUsuarios() { return temPermissao('gerenciarUsuarios'); }
function podeAprovar() { return temPermissao('aprovarCotacoes'); }

function logout() {
    if (!confirm('Deseja realmente sair do sistema?')) return;
    localStorage.removeItem('tagualife_sessao');
    sessionStorage.clear();
    window.location.replace('login.html');
}

function mostrarUsuarioLogado() {
    const sessao = getSessao();
    if (!sessao) return;
    const elNome = document.getElementById('usuarioLogado');
    const elCargo = document.getElementById('cargoLogado');
    const elCond = document.getElementById('condominioLogado');
    if (elNome) elNome.textContent = sessao.nome || '';
    if (elCargo) elCargo.textContent = sessao.cargo || '';
    if (elCond) elCond.textContent = sessao.condominio_nome || '';
}

function aplicarPermissoesNaTela() {
    document.querySelectorAll('[data-perm="cadastrar"]').forEach(el => {
        if (!podeCadastrar()) el.style.display = 'none';
    });
    document.querySelectorAll('[data-perm="editar"]').forEach(el => {
        if (!podeEditar()) el.style.display = 'none';
    });
    document.querySelectorAll('[data-perm="excluir"]').forEach(el => {
        if (!podeExcluir()) el.style.display = 'none';
    });
    document.querySelectorAll('[data-perm="aprovar"]').forEach(el => {
        if (!podeAprovar()) el.style.display = 'none';
    });
}

function protegerPagina() {
    if (!estaLogado()) {
        window.location.replace('login.html');
        return false;
    }
    // Sem condomínio vinculado — força re-login após migração
    const s = getSessao();
    if (s && !s.condominio_id) {
        console.warn('Sessão sem condominio_id — faça login novamente');
    }
    return true;
}


function ehAdministrador() {
    return getCargo() === 'Administrador';
}

/** Mostra link Usuários só para Administrador; em usuarios.html redireciona se não for admin */
function mostrarNavUsuariosAdmin() {
    const el = document.getElementById('navUsuarios');
    const admin = ehAdministrador();
    if (el) el.style.display = admin ? '' : 'none';
    const path = (window.location.pathname || '').toLowerCase();
    if (path.includes('usuarios.html') && !admin) {
        window.location.replace('index.html');
    }
}

function iniciarSeguranca() {
    const path = (window.location.pathname || '').toLowerCase();
    if (path.includes('login.html')) return;
    if (!protegerPagina()) return;
    mostrarUsuarioLogado();
    aplicarPermissoesNaTela();
    mostrarNavUsuariosAdmin();
}


(function checagemImediata() {
    try {
        const path = (window.location.pathname || '').toLowerCase();
        if (path.includes('login.html')) return;
        if (!localStorage.getItem('tagualife_sessao')) {
            window.location.replace('login.html');
        }
    } catch (e) {}
})();

document.addEventListener('DOMContentLoaded', iniciarSeguranca);

window.addEventListener('pageshow', function () {
    try {
        const path = (window.location.pathname || '').toLowerCase();
        if (path.includes('login.html')) return;
        if (!estaLogado()) window.location.replace('login.html');
    } catch (e) {}
});

window.addEventListener('storage', function (e) {
    if (e.key === 'tagualife_sessao' && !e.newValue) {
        const path = (window.location.pathname || '').toLowerCase();
        if (!path.includes('login.html')) window.location.replace('login.html');
    }
});
