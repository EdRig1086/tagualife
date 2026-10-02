/**
 * perfil.js — Menu do usuário: perfil, senha, sair
 * Depende de: auth.js (getSessao), Supabase global (window.sb ou cria cliente)
 */
(function () {
    const SUPABASE_URL = 'https://frlecudymdpnrsilavbj.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_Uv-GZdW4peH3IZTIwiNYXg_IrYytpn4';

    function getSb() {
        if (window.sb) return window.sb;
        if (window.supabase && window.supabase.createClient) {
            window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            return window.sb;
        }
        return null;
    }

    async function hashSenha(senha) {
        if (typeof window.hashSenhaTagua === 'function') {
            return window.hashSenhaTagua(senha);
        }
        const enc = new TextEncoder();
        const data = enc.encode('tagualife_v1_' + senha);
        const buf = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function ensureStyles() {
        if (document.getElementById('perfilMenuStyles')) return;
        const st = document.createElement('style');
        st.id = 'perfilMenuStyles';
        st.textContent = `
.user-menu-wrap{position:relative;display:inline-flex;align-items:center;}
.user-menu-btn{display:inline-flex;align-items:center;gap:.4rem;padding:.25rem .7rem;border-radius:40px;
  border:1px solid var(--border-color,#D8DCCE);background:var(--bg-card,#FBFBF7);color:var(--text-primary,#191D1B);
  font-size:.7rem;font-weight:600;cursor:pointer;font-family:inherit;}
.user-menu-btn:hover{border-color:var(--verde-oliva,#7A816E);}
.user-menu-btn .avatar{width:22px;height:22px;border-radius:50%;background:#C1CE83;color:#191D1B;
  display:inline-flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:800;overflow:hidden;}
.user-menu-btn .avatar img{width:100%;height:100%;object-fit:cover;}
.user-menu-drop{display:none;position:absolute;right:0;top:calc(100% + 6px);min-width:200px;background:var(--bg-card,#fff);
  border:1px solid var(--border-color,#D8DCCE);border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.12);z-index:9999;overflow:hidden;}
.user-menu-drop.open{display:block;}
.user-menu-drop button,.user-menu-drop a{display:flex;align-items:center;gap:.5rem;width:100%;text-align:left;
  padding:.55rem .85rem;border:0;background:transparent;color:var(--text-primary,#191D1B);font-size:.75rem;
  font-family:inherit;cursor:pointer;text-decoration:none;}
.user-menu-drop button:hover,.user-menu-drop a:hover{background:rgba(193,206,131,.25);}
.user-menu-drop .sep{border-top:1px solid var(--border-color,#D8DCCE);margin:.2rem 0;}
.user-menu-drop .danger{color:#8B3A3A;}
.perfil-modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:10050;
  align-items:center;justify-content:center;padding:1rem;}
.perfil-modal-overlay.open{display:flex;}
.perfil-modal{background:var(--bg-card,#FBFBF7);border-radius:12px;width:100%;max-width:420px;
  border:1px solid var(--border-color,#D8DCCE);box-shadow:0 12px 40px rgba(0,0,0,.15);}
.perfil-modal header{display:flex;justify-content:space-between;align-items:center;padding:.8rem 1rem;
  border-bottom:1px solid var(--border-color,#D8DCCE);font-weight:700;font-size:.9rem;}
.perfil-modal .body{padding:1rem;}
.perfil-modal label{display:block;font-size:.7rem;font-weight:600;margin:.5rem 0 .25rem;color:var(--text-secondary,#7A816E);}
.perfil-modal input{width:100%;padding:.5rem .65rem;border-radius:8px;border:1px solid var(--border-color,#D8DCCE);
  background:var(--input-bg,transparent);color:var(--text-primary,#191D1B);font-size:.85rem;font-family:inherit;box-sizing:border-box;}
.perfil-modal footer{display:flex;gap:.5rem;justify-content:flex-end;padding:.8rem 1rem;border-top:1px solid var(--border-color,#D8DCCE);}
.perfil-modal .btn{padding:.4rem .85rem;border-radius:8px;border:1px solid var(--border-color,#D8DCCE);
  background:var(--bg-body,#E8EBE0);cursor:pointer;font-size:.75rem;font-family:inherit;}
.perfil-modal .btn-primary{background:#191D1B;color:#FBFBF7;border-color:#191D1B;}
.perfil-msg{font-size:.75rem;margin-top:.5rem;min-height:1.1em;}
`;
        document.head.appendChild(st);
    }

    function ensureModals() {
        if (document.getElementById('modalPerfilTagua')) return;
        const html = `
<div class="perfil-modal-overlay" id="modalPerfilTagua">
  <div class="perfil-modal">
    <header><span><i class="fas fa-user-edit"></i> Editar meu perfil</span>
      <button type="button" class="btn" id="fecharModalPerfil">✕</button></header>
    <div class="body">
      <label>Nome</label>
      <input type="text" id="perfilNome" maxlength="80" />
      <label>E-mail</label>
      <input type="email" id="perfilEmail" readonly style="opacity:.7" />
      <label>Cargo</label>
      <input type="text" id="perfilCargo" readonly style="opacity:.7" />
      <div class="perfil-msg" id="perfilMsg"></div>
    </div>
    <footer>
      <button type="button" class="btn" id="cancelarPerfil">Cancelar</button>
      <button type="button" class="btn btn-primary" id="salvarPerfil">Salvar</button>
    </footer>
  </div>
</div>
<div class="perfil-modal-overlay" id="modalSenhaTagua">
  <div class="perfil-modal">
    <header><span><i class="fas fa-key"></i> Alterar minha senha</span>
      <button type="button" class="btn" id="fecharModalSenha">✕</button></header>
    <div class="body">
      <label>Senha atual</label>
      <input type="password" id="senhaAtual" autocomplete="current-password" />
      <label>Nova senha</label>
      <input type="password" id="senhaNova" autocomplete="new-password" />
      <label>Confirmar nova senha</label>
      <input type="password" id="senhaNova2" autocomplete="new-password" />
      <div class="perfil-msg" id="senhaMsg"></div>
    </div>
    <footer>
      <button type="button" class="btn" id="cancelarSenha">Cancelar</button>
      <button type="button" class="btn btn-primary" id="salvarSenha">Alterar senha</button>
    </footer>
  </div>
</div>`;
        document.body.insertAdjacentHTML('beforeend', html);

        const close = (id) => document.getElementById(id).classList.remove('open');
        document.getElementById('fecharModalPerfil').onclick = () => close('modalPerfilTagua');
        document.getElementById('cancelarPerfil').onclick = () => close('modalPerfilTagua');
        document.getElementById('fecharModalSenha').onclick = () => close('modalSenhaTagua');
        document.getElementById('cancelarSenha').onclick = () => close('modalSenhaTagua');

        document.getElementById('salvarPerfil').onclick = salvarPerfil;
        document.getElementById('salvarSenha').onclick = salvarSenha;
    }

    function abrirPerfil() {
        const s = typeof getSessao === 'function' ? getSessao() : null;
        if (!s) return;
        document.getElementById('perfilNome').value = s.nome || '';
        document.getElementById('perfilEmail').value = s.email || '';
        document.getElementById('perfilCargo').value = s.cargo || '';
        document.getElementById('perfilMsg').textContent = '';
        document.getElementById('modalPerfilTagua').classList.add('open');
        fecharDrop();
    }

    function abrirSenha() {
        document.getElementById('senhaAtual').value = '';
        document.getElementById('senhaNova').value = '';
        document.getElementById('senhaNova2').value = '';
        document.getElementById('senhaMsg').textContent = '';
        document.getElementById('modalSenhaTagua').classList.add('open');
        fecharDrop();
    }

    async function salvarPerfil() {
        const s = typeof getSessao === 'function' ? getSessao() : null;
        const msg = document.getElementById('perfilMsg');
        const nome = (document.getElementById('perfilNome').value || '').trim();
        if (!s || !s.id) { msg.textContent = 'Sessão inválida'; return; }
        if (nome.length < 2) { msg.textContent = 'Nome muito curto'; return; }
        const sb = getSb();
        if (!sb) { msg.textContent = 'Sem conexão'; return; }
        try {
            const { error } = await sb.from('usuarios').update({
                nome: nome,
                atualizado_em: new Date().toISOString()
            }).eq('id', s.id);
            if (error) throw error;
            s.nome = nome;
            localStorage.setItem('tagualife_sessao', JSON.stringify(s));
            if (typeof mostrarUsuarioLogado === 'function') mostrarUsuarioLogado();
            montarBotao();
            msg.style.color = '#2E7D32';
            msg.textContent = '✅ Perfil atualizado!';
            setTimeout(() => document.getElementById('modalPerfilTagua').classList.remove('open'), 800);
        } catch (e) {
            msg.style.color = '#8B3A3A';
            msg.textContent = '❌ ' + (e.message || e);
        }
    }

    async function salvarSenha() {
        const s = typeof getSessao === 'function' ? getSessao() : null;
        const msg = document.getElementById('senhaMsg');
        const atual = document.getElementById('senhaAtual').value;
        const nova = document.getElementById('senhaNova').value;
        const nova2 = document.getElementById('senhaNova2').value;
        if (!s || !s.id) { msg.textContent = 'Sessão inválida'; return; }
        if (!atual || !nova) { msg.textContent = 'Preencha os campos'; return; }
        if (nova.length < 4) { msg.textContent = 'Nova senha: mínimo 4 caracteres'; return; }
        if (nova !== nova2) { msg.textContent = 'Confirmação não confere'; return; }
        const sb = getSb();
        if (!sb) { msg.textContent = 'Sem conexão'; return; }
        try {
            const { data: user, error: e1 } = await sb.from('usuarios')
                .select('id,senha_hash').eq('id', s.id).maybeSingle();
            if (e1) throw e1;
            if (!user) throw new Error('Usuário não encontrado');
            const hashAtual = await hashSenha(atual);
            const ok = user.senha_hash === atual || user.senha_hash === hashAtual;
            if (!ok) { msg.style.color = '#8B3A3A'; msg.textContent = 'Senha atual incorreta'; return; }
            const hashNova = await hashSenha(nova);
            const { error } = await sb.from('usuarios').update({
                senha_hash: hashNova,
                atualizado_em: new Date().toISOString()
            }).eq('id', s.id);
            if (error) throw error;
            msg.style.color = '#2E7D32';
            msg.textContent = '✅ Senha alterada!';
            setTimeout(() => document.getElementById('modalSenhaTagua').classList.remove('open'), 800);
        } catch (e) {
            msg.style.color = '#8B3A3A';
            msg.textContent = '❌ ' + (e.message || e);
        }
    }

    function fecharDrop() {
        const d = document.getElementById('userMenuDrop');
        if (d) d.classList.remove('open');
    }

    function montarBotao() {
        const s = typeof getSessao === 'function' ? getSessao() : null;
        if (!s) return;

        let host = document.getElementById('userMenuMount');
        if (!host) {
            // tenta achar área do usuário na topbar
            const nomeEl = document.getElementById('usuarioLogado');
            if (nomeEl && nomeEl.parentElement) {
                host = document.createElement('div');
                host.id = 'userMenuMount';
                nomeEl.parentElement.style.display = 'none';
                nomeEl.parentElement.insertAdjacentElement('afterend', host);
            } else {
                const top = document.querySelector('.app-topbar');
                if (top) {
                    host = document.createElement('div');
                    host.id = 'userMenuMount';
                    top.appendChild(host);
                }
            }
        }
        if (!host) return;

        const inicial = (s.nome || 'U').trim().charAt(0).toUpperCase();
        host.innerHTML = `
<div class="user-menu-wrap">
  <button type="button" class="user-menu-btn" id="userMenuBtn" aria-haspopup="true">
    <span class="avatar" id="userAvatar">${inicial}</span>
    <span>${s.nome || 'Usuário'}</span>
    <i class="fas fa-caret-down" style="font-size:.65rem;opacity:.7"></i>
  </button>
  <div class="user-menu-drop" id="userMenuDrop">
    <button type="button" id="menuEditarPerfil"><i class="fas fa-user-edit"></i> Editar meu perfil</button>
    <button type="button" id="menuAlterarSenha"><i class="fas fa-key"></i> Alterar minha senha</button>
    <div class="sep"></div>
    <button type="button" class="danger" id="menuSair"><i class="fas fa-sign-out-alt"></i> Sair</button>
  </div>
</div>`;

        document.getElementById('userMenuBtn').onclick = function (e) {
            e.stopPropagation();
            document.getElementById('userMenuDrop').classList.toggle('open');
        };
        document.getElementById('menuEditarPerfil').onclick = abrirPerfil;
        document.getElementById('menuAlterarSenha').onclick = abrirSenha;
        document.getElementById('menuSair').onclick = function () {
            fecharDrop();
            if (typeof logout === 'function') logout();
            else {
                localStorage.removeItem('tagualife_sessao');
                location.href = 'login.html';
            }
        };
        document.addEventListener('click', function () { fecharDrop(); });
    }

    function init() {
        const path = (location.pathname || '').toLowerCase();
        if (path.includes('login.html')) return;
        ensureStyles();
        ensureModals();
        montarBotao();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
