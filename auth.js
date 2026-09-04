// auth.js - Controle de sessão e permissões TaguáLife

const PERMISSOES = {
    Administrador: {
        cadastrar: true,
        editar: true,
        excluir: true,
        verTudo: true,
        gerenciarUsuarios: true,
        aprovarCotacoes: true
    },
    Síndico: {
        cadastrar: true,
        editar: true,
        excluir: false,
        verTudo: true,
        gerenciarUsuarios: false,
        aprovarCotacoes: true
    },
    Síndica: {
        cadastrar: true,
        editar: true,
        excluir: false,
        verTudo: true,
        gerenciarUsuarios: false,
        aprovarCotacoes: true
    },
    Almoxarife: {
        cadastrar: true,
        editar: true,
        excluir: false,
        verTudo: false,
        gerenciarUsuarios: false,
        aprovarCotacoes: false
    },
    Manutenção: {
        cadastrar: false,
        editar: false,
        excluir: false,
        verTudo: false,
        gerenciarUsuarios: false,
        aprovarCotacoes: false
    },
    Porteiro: {
        cadastrar: false,
        editar: false,
        excluir: false,
        verTudo: false,
        gerenciarUsuarios: false,
        aprovarCotacoes: false
    },
    Zelador: {
        cadastrar: false,
        editar: false,
        excluir: false,
        verTudo: false,
        gerenciarUsuarios: false,
        aprovarCotacoes: false
    },
    Usuário: {
        cadastrar: false,
        editar: false,
        excluir: false,
        verTudo: false,
        gerenciarUsuarios: false,
        aprovarCotacoes: false
    }
};

// Pega a sessão atual
function getSessao() {
    try {
        const raw = localStorage.getItem('tagualife_sessao');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

// Verifica se está logado
function estaLogado() {
    return !!getSessao();
}

// Protege a página: se não estiver logado, manda para o login
function protegerPagina() {
    if (!estaLogado()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Retorna o cargo do usuário logado
function getCargo() {
    const sessao = getSessao();
    return sessao ? (sessao.cargo || 'Usuário') : null;
}

// Verifica se o usuário tem determinada permissão
function temPermissao(acao) {
    const cargo = getCargo();
    if (!cargo) return false;
    const perms = PERMISSOES[cargo] || PERMISSOES['Usuário'];
    return !!perms[acao];
}

// Atalhos práticos
function podeCadastrar()   { return temPermissao('cadastrar'); }
function podeEditar()      { return temPermissao('editar'); }
function podeExcluir()     { return temPermissao('excluir'); }
function podeVerTudo()     { return temPermissao('verTudo'); }
function podeGerenciarUsuarios() { return temPermissao('gerenciarUsuarios'); }
function podeAprovar()     { return temPermissao('aprovarCotacoes'); }

// Logout
function logout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        localStorage.removeItem('tagualife_sessao');
        window.location.href = 'login.html';
    }
}

// Mostra o nome e cargo do usuário logado (se existir o elemento)
function mostrarUsuarioLogado() {
    const sessao = getSessao();
    if (!sessao) return;

    const elNome = document.getElementById('usuarioLogado');
    const elCargo = document.getElementById('cargoLogado');

    if (elNome) elNome.textContent = sessao.nome || '';
    if (elCargo) elCargo.textContent = sessao.cargo || '';
}

// Esconde botões de acordo com a permissão
function aplicarPermissoesNaTela() {
    // Botões de cadastrar / salvar
    document.querySelectorAll('[data-perm="cadastrar"]').forEach(el => {
        if (!podeCadastrar()) el.style.display = 'none';
    });

    // Botões de editar
    document.querySelectorAll('[data-perm="editar"]').forEach(el => {
        if (!podeEditar()) el.style.display = 'none';
    });

    // Botões de excluir
    document.querySelectorAll('[data-perm="excluir"]').forEach(el => {
        if (!podeExcluir()) el.style.display = 'none';
    });

    // Botões de aprovar
    document.querySelectorAll('[data-perm="aprovar"]').forEach(el => {
        if (!podeAprovar()) el.style.display = 'none';
    });
}

// Inicialização automática quando o arquivo for carregado
document.addEventListener('DOMContentLoaded', function () {
    // Não protege a própria página de login
    if (!window.location.pathname.includes('login.html')) {
        protegerPagina();
        mostrarUsuarioLogado();
        aplicarPermissoesNaTela();
    }
});
