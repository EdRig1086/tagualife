/**
 * perfil.js — Menu do usuário: perfil, foto, senha, sair
 * Depende de: auth.js (getSessao), Supabase global (window.sb ou cria cliente)
 */
(function () {
    const SUPABASE_URL = 'https://frlecudymdpnrsilavbj.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_Uv-GZdW4peH3IZTIwiNYXg_IrYytpn4';

    var _fotoPendente = null;

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

    function getFotoKey(s) {
        const id = (s && (s.id || s.email)) || 'user';
        return 'tagualife_foto_' + String(id);
    }

    function getFotoUsuario(s) {
        if (!s) return null;
        if (s.foto) return s.foto;
        try {
            return localStorage.getItem(getFotoKey(s)) || null;
        } catch (e) {
            return null;
        }
    }

    function setFotoPreview(dataUrl, inicial) {
        const el = document.getElementById('perfilFotoPreview');
        if (!el) return;
        if (dataUrl) {
            el.innerHTML = '<img src="' + dataUrl + '" alt="Foto" />';
        } else {
            el.textContent = (inicial || 'U').toString().charAt(0).toUpperCase();
        }
    }

    function setAvatarMenu(dataUrl, inicial) {
        const av = document.getElementById('userAvatar');
        if (!av) return;
        if (dataUrl) {
            av.innerHTML = '<img src="' + dataUrl + '" alt="Foto" />';
        } else {
            av.textContent = (inicial || 'U').toString().charAt(0).toUpperCase();
        }
    }

    function comprimirFoto(file, maxLado, qualidade) {
        maxLado = maxLado || 256;
        qualidade = qualidade || 0.85;
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();
            reader.onerror = function () { reject(new Error('Falha ao ler arquivo')); };
            reader.onload = function () {
                const img = new Image();
                img.onerror = function () { reject(new Error('Imagem inválida')); };
                img.onload = function () {
                    let w = img.width, h = img.height;
                    if (w > maxLado || h > maxLado) {
                        if (w > h) {
                            h = Math.round(h * maxLado / w);
                            w = maxLado;
                        } else {
                            w = Math.round(w * maxLado / h);
                            h = maxLado;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    try {
                        resolve(canvas.toDataURL('image/jpeg', qualidade));
                    } catch (e) {
                        reject(e);
                    }
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
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
.user-menu-btn .avatar{width:28px;height:28px;border-radius:50%;background:#C1CE83;color:#191D1B;
  display:inline-flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;overflow:hidden;flex-shrink:0;}
.user-menu-btn .avatar img{width:100%;height:100%;object-fit:cover;display:block;}
.user-menu-btn .user-meta{display:flex;flex-direction:column;align-items:flex-start;line-height:1.15;min-width:0;}
.user-menu-btn .user-meta .user-name{font-size:.72rem;font-weight:700;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.user-menu-btn .user-meta .user-role{font-size:.6rem;font-weight:600;color:#7A816E;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.user-menu-btn .user-meta .user-role.admin{color:#2E5A3C;}
.user-menu-drop .drop-header{padding:.65rem .85rem .4rem;border-bottom:1px solid var(--border-color,#D8DCCE);margin-bottom:.15rem;}
.user-menu-drop .drop-header .dh-name{font-size:.8rem;font-weight:700;}
.user-menu-drop .drop-header .dh-role{font-size:.68rem;color:#7A816E;font-weight:600;}
.user-menu-drop .drop-header .dh-email{font-size:.62rem;color:#9AA08E;margin-top:.15rem;}
.user-menu-drop{display:none;position:absolute;right:0;top:calc(100% + 6px);min-width:200px;background:var(--bg-card,#fff);
  border:1px solid var(--border-color,#D8DCCE);border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.12);z-index:9999;overflow:hidden;}
.user-menu-drop.open{display:block;}
.user-menu-drop button,.user-menu-drop a{display:flex;align-items:center;gap:.5rem;width:100%;text-align:left;
  padding:.55rem .85rem;border:0;background:transparent;color:var(--text-primary,#191D1B);font-size:.75rem;
  font-family:inherit;cursor:pointer;text-decoration:none;}
.user-menu-drop button:hover,.user-menu-drop a:hover{background:rgba(193,206,131,.25);}
.user-menu-drop .sep{height:1px;background:var(--border-color,#D8DCCE);margin:.2rem 0;}
.user-menu-drop button.danger{color:#8B3A3A;}
.perfil-modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:10050;
  align-items:center;justify-content:center;padding:1rem;}
.perfil-modal-overlay.open{display:flex;}
.perfil-modal{background:var(--bg-card,#FBFBF7);color:var(--text-primary,#191D1B);border-radius:12px;
  width:100%;max-width:420px;border:1px solid var(--border-color,#D8DCCE);box-shadow:0 12px 40px rgba(0,0,0,.18);overflow:hidden;}
.perfil-modal header{display:flex;justify-content:space-between;align-items:center;padding:.75rem 1rem;
  border-bottom:1px solid var(--border-color,#D8DCCE);font-weight:700;font-size:.9rem;}
.perfil-modal .body{padding:1rem;}
.perfil-modal label{display:block;font-size:.7rem;font-weight:700;color:var(--text-secondary,#7A816E);margin:.45rem 0 .2rem;}
.perfil-modal input{width:100%;padding:.45rem .6rem;border-radius:8px;border:1px solid var(--border-color,#D8DCCE);
  background:var(--input-bg,transparent);color:var(--text-primary,#191D1B);font-size:.85rem;font-family:inherit;box-sizing:border-box;}
.perfil-modal footer{display:flex;gap:.5rem;justify-content:flex-end;padding:.8rem 1rem;border-top:1px solid var(--border-color,#D8DCCE);}
.perfil-modal .btn{padding:.4rem .85rem;border-radius:8px;border:1px solid var(--border-color,#D8DCCE);
  background:var(--bg-body,#E8EBE0);cursor:pointer;font-size:.75rem;font-family:inherit;}
.perfil-modal .btn-primary{background:#191D1B;color:#FBFBF7;border-color:#191D1B;}
.perfil-msg{font-size:.75rem;margin-top:.5rem;min-height:1.1em;}
.perfil-msg.ok{color:#2E7D32;}
.perfil-msg.err{color:#8B3A3A;}
.perfil-foto-box{display:flex;align-items:center;gap:1rem;margin-bottom:.5rem;}
.perfil-foto-preview{width:72px;height:72px;border-radius:50%;background:#C1CE83;color:#191D1B;
  display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:800;overflow:hidden;
  border:3px solid #7A816E;flex-shrink:0;}
.perfil-foto-preview img{width:100%;height:100%;object-fit:cover;display:block;}
.perfil-foto-actions{display:flex;flex-direction:column;gap:.35rem;}
.perfil-foto-actions label.btn-foto{display:inline-flex;align-items:center;gap:.35rem;padding:.4rem .75rem;
  border-radius:8px;border:1px solid #D8DCCE;background:#FBFBF7;font-size:.75rem;font-weight:600;cursor:pointer;}
.perfil-foto-actions label.btn-foto:hover{border-color:#7A816E;background:#F0F2EA;}
.perfil-foto-actions button.btn-foto-rm{padding:.35rem .7rem;border-radius:8px;border:1px solid #E8A090;
  background:#FCE8E0;color:#8B3A3A;font-size:.72rem;font-weight:600;cursor:pointer;font-family:inherit;}
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
      <div class="perfil-foto-box">
        <div class="perfil-foto-preview" id="perfilFotoPreview">U</div>
        <div class="perfil-foto-actions">
          <label class="btn-foto" for="perfilFotoInput"><i class="fas fa-camera"></i> Escolher foto</label>
          <input type="file" id="perfilFotoInput" accept="image/*" style="display:none" />
          <button type="button" class="btn-foto-rm" id="perfilFotoRemover">Remover foto</button>
          <span style="font-size:.65rem;color:#7A816E;">JPG ou PNG · será redimensionada</span>
        </div>
      </div>
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

        const fotoInput = document.getElementById('perfilFotoInput');
        if (fotoInput) {
            fotoInput.onchange = async function () {
                const file = fotoInput.files && fotoInput.files[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                    const msg = document.getElementById('perfilMsg');
                    msg.textContent = 'Arquivo muito grande (máx. 5 MB).';
                    msg.className = 'perfil-msg err';
                    fotoInput.value = '';
                    return;
                }
                try {
                    const msg = document.getElementById('perfilMsg');
                    msg.textContent = 'Processando foto...';
                    msg.className = 'perfil-msg';
                    _fotoPendente = await comprimirFoto(file, 256, 0.85);
                    setFotoPreview(_fotoPendente, 'U');
                    msg.textContent = 'Foto pronta — clique em Salvar.';
                    msg.className = 'perfil-msg ok';
                } catch (e) {
                    const msg = document.getElementById('perfilMsg');
                    msg.textContent = 'Erro na foto: ' + (e.message || e);
                    msg.className = 'perfil-msg err';
                }
                fotoInput.value = '';
            };
        }
        const btnRm = document.getElementById('perfilFotoRemover');
        if (btnRm) {
            btnRm.onclick = function () {
                _fotoPendente = null;
                const s = typeof getSessao === 'function' ? getSessao() : null;
                setFotoPreview(null, (s && s.nome) || 'U');
                const msg = document.getElementById('perfilMsg');
                msg.textContent = 'Foto removida — clique em Salvar para confirmar.';
                msg.className = 'perfil-msg';
            };
        }
    }

    function abrirPerfil() {
        const s = typeof getSessao === 'function' ? getSessao() : null;
        if (!s) return;
        fecharDrop();
        document.getElementById('perfilNome').value = s.nome || '';
        document.getElementById('perfilEmail').value = s.email || '';
        document.getElementById('perfilCargo').value = s.cargo || '';
        document.getElementById('perfilMsg').textContent = '';
        document.getElementById('perfilMsg').className = 'perfil-msg';
        _fotoPendente = getFotoUsuario(s);
        setFotoPreview(_fotoPendente, s.nome || 'U');
        document.getElementById('modalPerfilTagua').classList.add('open');
    }

    function abrirSenha() {
        const s = typeof getSessao === 'function' ? getSessao() : null;
        if (!s) return;
        fecharDrop();
        document.getElementById('senhaAtual').value = '';
        document.getElementById('senhaNova').value = '';
        document.getElementById('senhaNova2').value = '';
        document.getElementById('senhaMsg').textContent = '';
        document.getElementById('modalSenhaTagua').classList.add('open');
    }

    async function salvarPerfil() {
        const s = typeof getSessao === 'function' ? getSessao() : null;
        const msg = document.getElementById('perfilMsg');
        const nome = (document.getElementById('perfilNome').value || '').trim();
        if (!s || !s.id) {
            msg.textContent = 'Sessão inválida';
            msg.className = 'perfil-msg err';
            return;
        }
        if (nome.length < 2) {
            msg.textContent = 'Nome muito curto';
            msg.className = 'perfil-msg err';
            return;
        }
        const sb = getSb();
        if (!sb) {
            msg.textContent = 'Sem conexão';
            msg.className = 'perfil-msg err';
            return;
        }
        try {
            const payload = {
                nome: nome,
                atualizado_em: new Date().toISOString()
            };
            if (_fotoPendente) payload.foto = _fotoPendente;
            let { error } = await sb.from('usuarios').update(payload).eq('id', s.id);
            if (error && /foto|column/i.test(error.message || '')) {
                const r2 = await sb.from('usuarios').update({
                    nome: nome,
                    atualizado_em: new Date().toISOString()
                }).eq('id', s.id);
                error = r2.error;
            }
            if (error) throw error;
            s.nome = nome;
            try {
                if (_fotoPendente) {
                    s.foto = _fotoPendente;
                    localStorage.setItem(getFotoKey(s), _fotoPendente);
                } else {
                    delete s.foto;
                    localStorage.removeItem(getFotoKey(s));
                }
            } catch (eFoto) {
                console.warn(eFoto);
            }
            localStorage.setItem('tagualife_sessao', JSON.stringify(s));
            if (typeof mostrarUsuarioLogado === 'function') mostrarUsuarioLogado();
            montarBotao();
            setAvatarMenu(getFotoUsuario(s), s.nome);
            msg.className = 'perfil-msg ok';
            msg.textContent = '✅ Perfil atualizado' + (_fotoPendente ? ' com foto!' : '!');
            setTimeout(function () {
                document.getElementById('modalPerfilTagua').classList.remove('open');
            }, 800);
        } catch (e) {
            msg.className = 'perfil-msg err';
            msg.textContent = '❌ ' + (e.message || e);
        }
    }

    async function salvarSenha() {
        const s = typeof getSessao === 'function' ? getSessao() : null;
        const msg = document.getElementById('senhaMsg');
        const atual = document.getElementById('senhaAtual').value;
        const nova = document.getElementById('senhaNova').value;
        const nova2 = document.getElementById('senhaNova2').value;
        if (!s || !s.id) {
            msg.textContent = 'Sessão inválida';
            return;
        }
        if (!atual || !nova) {
            msg.textContent = 'Preencha os campos';
            return;
        }
        if (nova.length < 4) {
            msg.textContent = 'Nova senha: mínimo 4 caracteres';
            return;
        }
        if (nova !== nova2) {
            msg.textContent = 'Confirmação não confere';
            return;
        }
        const sb = getSb();
        if (!sb) {
            msg.textContent = 'Sem conexão';
            return;
        }
        try {
            const { data, error } = await sb.from('usuarios').select('id,senha_hash').eq('id', s.id).maybeSingle();
            if (error) throw error;
            if (!data) throw new Error('Usuário não encontrado');
            let ok = false;
            if (typeof window.verificarSenhaTagua === 'function') {
                ok = await window.verificarSenhaTagua(atual, data.senha_hash);
            } else {
                ok = data.senha_hash === atual || data.senha_hash === (await hashSenha(atual));
            }
            if (!ok) throw new Error('Senha atual incorreta');
            const novoHash = await hashSenha(nova);
            const { error: e2 } = await sb.from('usuarios').update({
                senha_hash: novoHash,
                atualizado_em: new Date().toISOString()
            }).eq('id', s.id);
            if (e2) throw e2;
            msg.style.color = '#2E7D32';
            msg.textContent = '✅ Senha alterada!';
            setTimeout(function () {
                document.getElementById('modalSenhaTagua').classList.remove('open');
            }, 800);
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
            const nomeEl = document.getElementById('usuarioLogado');
            if (nomeEl && nomeEl.parentElement) {
                host = document.createElement('div');
                host.id = 'userMenuMount';
                nomeEl.parentElement.style.display = 'none';
                nomeEl.parentElement.insertAdjacentElement('afterend', host);
            } else {
                // topbar comum do sistema
                const top = document.querySelector('.app-topbar .top-right, .app-topbar, .topbar-right, header .user-area');
                const bar = document.querySelector('.app-topbar') || document.querySelector('header');
                if (bar) {
                    host = document.createElement('div');
                    host.id = 'userMenuMount';
                    host.style.cssText = 'display:inline-flex;align-items:center;margin-left:auto;';
                    // tenta colocar perto do lado direito
                    const right = bar.querySelector('.top-right') || bar;
                    right.appendChild(host);
                }
            }
        }
        if (!host) return;

        const inicial = (s.nome || 'U').trim().charAt(0).toUpperCase();
        const cargo = (s.cargo || 'Usuário').trim();
        const isAdmin = cargo.toLowerCase() === 'administrador';
        const foto = getFotoUsuario(s);
        const avatarHtml = foto
            ? '<img src="' + foto + '" alt="Foto" />'
            : inicial;
        const roleClass = isAdmin ? 'user-role admin' : 'user-role';

        host.innerHTML =
            '<div class="user-menu-wrap">' +
            '<button type="button" class="user-menu-btn" id="userMenuBtn" aria-haspopup="true" title="' + (s.nome || '') + ' — ' + cargo + '">' +
            '<span class="avatar" id="userAvatar">' + avatarHtml + '</span>' +
            '<span class="user-meta">' +
            '<span class="user-name">' + (s.nome || 'Usuário') + '</span>' +
            '<span class="' + roleClass + '">' + cargo + '</span>' +
            '</span>' +
            '<i class="fas fa-caret-down" style="font-size:.65rem;opacity:.7"></i>' +
            '</button>' +
            '<div class="user-menu-drop" id="userMenuDrop">' +
            '<div class="drop-header">' +
            '<div class="dh-name">' + (s.nome || 'Usuário') + '</div>' +
            '<div class="dh-role">' + cargo + (isAdmin ? ' · acesso total' : '') + '</div>' +
            (s.email ? '<div class="dh-email">' + s.email + '</div>' : '') +
            '</div>' +
            '<button type="button" id="menuEditarPerfil"><i class="fas fa-user-edit"></i> Editar meu perfil</button>' +
            '<button type="button" id="menuAlterarSenha"><i class="fas fa-key"></i> Alterar minha senha</button>' +
            '<div class="sep"></div>' +
            '<button type="button" class="danger" id="menuSair"><i class="fas fa-sign-out-alt"></i> Sair</button>' +
            '</div></div>';

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
        document.addEventListener('click', function () {
            fecharDrop();
        });
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
