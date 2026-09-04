// config.js - Conexão com Supabase
const SUPABASE_CONFIG = {
    url: 'https://frlecudymdpnrsilavbj.supabase.co',
    // ⬇️ USE A PUBLISHABLE KEY (NÃO a secret key!)
    anonKey: 'sb_publishable_Uv-GZdW4peH3IZTIwiNYXg_IrYytpn4'
};

// Exportar para uso global
window.TAGUALIFE_CONFIG = SUPABASE_CONFIG;
window.TAGUALIFE_VERSION = '2.0.0';

console.log('🔌 Conectado ao Supabase!');
console.log('📦 Projeto:', SUPABASE_CONFIG.url);
