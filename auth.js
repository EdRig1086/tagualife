// auth.js - Sessão, permissões e segurança TaguáLife
const PERMISSOES = {
    Administrador: {
        cadastrar: true, editar: true, excluir: true,
        verTudo: true, gerenciarUsuarios: true, aprovarCotacoes: true
    },
    Síndico: {
        cadastrar: true, editar: true, excluir: false,
        verTudo: true, gerenciarUsuarios: false, aprovarCotacoes: true
    },
    Síndica: {
        cadastrar: true, editar: true, excluir: false,
        verTudo: true, gerenciarUsuarios: false, aprovarCotacoes: true
    },
    Almoxarife: {
        cadastrar: true, editar: true, excluir: false,
        verTudo: false, gerenciarUsuarios: false, aprovarCotacoes: false
    },
    Manutenção: {
        cadastrar: false, editar: false, excluir: false,
        verTudo: false, gerenciarUsuarios: false, aprovarCotacoes: false
    },
    Porteiro: {
        cadastrar: false, editar: false, excluir: false,
        verTudo: false, gerenciarUsuarios: false, aprovarCotacoes: false
    },
    Zelador: {
        cadastrar: false, editar: false, excluir: false,
        verTudo: false, gerenciarUsuarios: false, aprovarCotacoes: false
    },
    Usuário: {
        cadastrar: false, editar: false, excluir: false,
        verTudo: false, gerenciarUsuarios: false, aprovarCotacoes: false
    }
};

function getSessao() {
    try {
        const raw = localStorage.getItem('tagualife_sessao');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function estaLogado() {
    return !!getSessao();
}

function protegerPagina() {
    if (!estaLogado()) {
        window.location.replace('login.html');
        return false;
    }
    return true;
}

function getCargo() {
    const sessao = getSessao();
    return sessao ? (sessao.cargo || 'Usuário') : null;
}

function temPermissao(acao) {
    const cargo = getCargo();
    if (!cargo) return false;
    const perms = PERMISSOES[cargo] || PERMISSOES['Usuário'];
    return !!perms[acao];
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
    // replace: não deixa voltar com o botão Voltar
    window.location.replace('login.html');
}

function mostrarUsuarioLogado() {
    const sessao = getSessao();
    if (!sessao) return;
    const elNome = document.getElementById('usuarioLogado');
    const elCargo = document.getElementById('cargoLogado');
    if (elNome) elNome.textContent = sessao.nome || '';
    if (elCargo) elCargo.textContent = sessao.cargo || '';
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

// Checagem imediata (antes do DOM) — barra o acesso sem login
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

// Botão Voltar / cache
window.addEventListener('pageshow', function (event) {
    try {
        const path = (window.location.pathname || '').toLowerCase();
        if (path.includes('login.html')) return;
        if (!estaLogado()) {
            window.location.replace('login.html');
        }
    } catch (e) {}
});

// Sair em outra aba → esta também vai para o login
window.addEventListener('storage', function (e) {
    if (e.key === 'tagualife_sessao' && !e.newValue) {
        const path = (window.location.pathname || '').toLowerCase();
        if (!path.includes('login.html')) {
            window.location.replace('login.html');
        }
    }
});
