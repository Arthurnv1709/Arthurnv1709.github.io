// ====== CONFIGURAÇÕES DO SEU PROJETO ======
const CLIENT_ID = "Ov23livSfNhD3Gy96Vq1"; // Seu Client ID já está aqui configurado
const PROXY_URL = "https://portfoliohub-proxy-x8p8.vercel.app/api/auth"; // ⚠️ APAGUE ESTE LINK E COLE O SEU LINK DA VERCEL AQUI (mantenha as aspas)
// ==========================================

// 1. Inicia o fluxo de login redirecionando para o GitHub
function conectarGithub() {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo`;
  window.location.href = githubAuthUrl;
}

// 2. Roda automaticamente ao carregar a página para checar o retorno do GitHub
async function verificarRetornoDoGithub() {
  const urlParams = new URLSearchParams(window.location.search);
  const codigoTemporario = urlParams.get('code');
  const botao = document.getElementById('btn-github');

  if (codigoTemporario) {
    if (botao) botao.innerText = "Conectando ao GitHub...";
    window.history.replaceState({}, document.title, window.location.pathname);

    try {
      const response = await fetch(`${PROXY_URL}?code=${codigoTemporario}`);
      const data = await response.json();

      if (data.access_token) {
        localStorage.setItem('gh_token', data.access_token);
        if (botao) botao.innerText = "Sincronizado!";
        buscarProjetos(data.access_token);
      } else {
        if (botao) botao.innerText = "Erro na sincronização";
        console.error("Erro do proxy:", data);
      }
    } catch (erro) {
      if (botao) botao.innerText = "Erro de conexão";
      console.error("Erro ao conectar na Vercel:", erro);
    }
  } else {
    const tokenSalvo = localStorage.getItem('gh_token');
    if (tokenSalvo) {
      if (botao) botao.innerText = "Atualizar Projetos";
      buscarProjetos(tokenSalvo);
    }
  }
}

// 3. Busca os dados dos repositórios usando o Token
async function buscarProjetos(token) {
  const container = document.getElementById('meus-projetos-github');
  if (container) container.innerHTML = "<p>Carregando projetos...</p>";

  try {
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=12', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json'
      }
    });

    if (!response.ok) throw new Error("Token inválido ou expirado");

    const repositorios = await response.json();
    renderizarProjetosNaTela(repositorios);

  } catch (erro) {
    console.error("Erro ao buscar projetos:", erro);
    if (container) container.innerHTML = "<p>Erro ao carregar projetos. Tente sincronizar novamente.</p>";
    localStorage.removeItem('gh_token');
  }
}

// 4. Cria os elementos visuais na tela
function renderizarProjetosNaTela(projetos) {
  const container = document.getElementById('meus-projetos-github');
  if (!container) return;

  container.innerHTML = "";

  const projetosProprios = projetos.filter(repo => !repo.fork);

  if (projetosProprios.length === 0) {
    container.innerHTML = "<p>Nenhum repositório público encontrado.</p>";
    return;
  }

  projetosProprios.forEach(repo => {
    const card = document.createElement('div');
    card.innerHTML = `
      <div style="border: 1px solid #e1e4e8; padding: 16px; border-radius: 6px; margin-bottom: 12px; background: #fff; font-family: sans-serif;">
        <h3 style="margin-top: 0; color: #0366d6;">${repo.name}</h3>
        <p style="color: #586069; font-size: 14px;">${repo.description || 'Sem descrição.'}</p>
        <div style="font-size: 12px; color: #24292e; margin-bottom: 10px;">
          <strong>Linguagem:</strong> ${repo.language || 'Mista'} | 
          <strong>⭐ Estrelas:</strong> ${repo.stargazers_count}
        </div>
        <a href="${repo.html_url}" target="_blank" style="text-decoration: none; color: #fff; background: #24292e; padding: 6px 12px; border-radius: 4px; font-size: 12px; display: inline-block;">Ver no GitHub</a>
      </div>
    `;
    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", verificarRetornoDoGithub);
