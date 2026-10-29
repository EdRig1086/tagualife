
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
        gerenciarUsuarios: false, aprovarCotacoes: false,
        soEstoque: true
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
    // Multi-condomínio: só filtra se a sessão tiver condominio_id E o sistema estiver em modo multi
    // (hoje a maioria das tabelas ainda NÃO tem a coluna condominio_id — filtrar quebra a query)
    try {
        const id = getCondominioId();
        if (!id) return query;
        // Desativado até as tabelas terem a coluna. Para reativar: localStorage.setItem('tagualife_multi', '1')
        if (localStorage.getItem('tagualife_multi') !== '1') return query;
        return query.eq('condominio_id', id);
    } catch (e) {
        return query;
    }
}

/** Payload padrão para INSERT com condomínio (só se multi ativo) */
function payloadComCondominio(obj) {
    const base = Object.assign({}, obj || {});
    try {
        // Mesma trava do comCondominio: não manda condominio_id se as tabelas ainda não têm a coluna
        if (localStorage.getItem('tagualife_multi') !== '1') return base;
        const id = getCondominioId();
        if (id) base.condominio_id = id;
    } catch (e) {}
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
    try { aplicarRestricaoManutencao(); } catch (e) {}
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

window.addEventListener('pageshow', function (ev) {
    try {
        const path = (window.location.pathname || '').toLowerCase();
        if (path.includes('login.html')) return;
        if (!estaLogado()) {
            window.location.replace('login.html');
            return;
        }
        // bfcache: revalida permissões ao voltar
        if (ev && ev.persisted) {
            try { aplicarPermissoesNaTela(); mostrarNavUsuariosAdmin(); aplicarRestricaoManutencao(); } catch (e2) {}
        }
    } catch (e) {}
});

window.addEventListener('storage', function (e) {
    if (e.key === 'tagualife_sessao' && !e.newValue) {
        const path = (window.location.pathname || '').toLowerCase();
        if (!path.includes('login.html')) window.location.replace('login.html');
    }
});


function ehManutencao() {
    return getCargo() === 'Manutenção';
}

/** Manutenção: só consulta estoque (saber o que tem / o que falta) */
function soConsultaEstoque() {
    const p = PERMISSOES[getCargo()] || {};
    return !!p.soEstoque || ehManutencao();
}

function aplicarRestricaoManutencao() {
    if (!soConsultaEstoque()) return;
    const path = (window.location.pathname || window.location.href || '').toLowerCase();
    const livre = path.includes('login.html') || path.includes('estoque.html');
    // Dashboard opcional bloqueado — só estoque
    if (!livre) {
        window.location.replace('estoque.html');
        return;
    }
    // Esconde menus que não são Estoque / Sair / Tema
    document.querySelectorAll('.nav-menu .nav-item').forEach(function(el) {
        const href = (el.getAttribute('href') || '').toLowerCase();
        const onclick = (el.getAttribute('onclick') || '');
        const id = el.id || '';
        if (href.includes('estoque.html')) return;
        if (onclick.indexOf('logout') >= 0 || onclick.indexOf('toggleTheme') >= 0) return;
        if (id === 'themeIcon' || el.classList.contains('btn-theme')) return;
        if (el.tagName === 'BUTTON' && (onclick.indexOf('Theme') >= 0 || onclick.indexOf('logout') >= 0)) return;
        // mantém tema e sair
        if (el.textContent && /tema|sair/i.test(el.textContent)) return;
        el.style.display = 'none';
    });
}

// Exports globais
try {
    window.comCondominio = comCondominio;
    window.payloadComCondominio = payloadComCondominio;
    window.getSessao = getSessao;
    window.protegerPagina = protegerPagina;
    window.logout = logout;
    window.podeCadastrar = podeCadastrar;
    window.podeEditar = podeEditar;
    window.podeExcluir = podeExcluir;
    window.ehAdministrador = ehAdministrador;
    window.getCargo = getCargo;
    window.ehManutencao = ehManutencao;
    window.soConsultaEstoque = soConsultaEstoque;
    window.aplicarRestricaoManutencao = aplicarRestricaoManutencao;
} catch (e) {}
