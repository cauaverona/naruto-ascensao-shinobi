interface Style {
  title: string;
  strike: string;
  accent: string;
  opener: 'pressao' | 'guarda' | 'alcance' | 'finta';
}

export const DUEL_STYLES: Record<string, Style> = {
  naruto: { title: 'Pressão e improviso', strike: 'Investida turbulenta', accent: '#f0a75d', opener: 'pressao' },
  sasuke: { title: 'Fintas e arremessos', strike: 'Chute de giro', accent: '#a7b8ee', opener: 'finta' },
  sakura: { title: 'Guarda e leitura', strike: 'Golpe de resposta', accent: '#eca3b2', opener: 'guarda' },
  ino: { title: 'Fintas e brechas', strike: 'Passo cruzado', accent: '#c8ace7', opener: 'finta' },
  shikamaru: { title: 'Distância e iscas', strike: 'Rasteira de corte', accent: '#c3c98a', opener: 'alcance' },
  choji: { title: 'Guarda firme', strike: 'Ombro de avanço', accent: '#e4ae7c', opener: 'guarda' },
  kiba: { title: 'Fechamento rápido', strike: 'Bote em arco', accent: '#e18d71', opener: 'pressao' },
  hinata: { title: 'Contra-ataque preciso', strike: 'Palma curta', accent: '#e5d3ef', opener: 'guarda' },
  shino: { title: 'Controle de alcance', strike: 'Corte de aproximação', accent: '#a4c295', opener: 'alcance' },
  emi: { title: 'Passos e fintas', strike: 'Giro lateral', accent: '#e2b383', opener: 'finta' },
  maki: { title: 'Guarda da ronda', strike: 'Chute de contenção', accent: '#e0ad74', opener: 'guarda' },
  daichi: { title: 'Corpo a corpo', strike: 'Direto de avanço', accent: '#cb9b80', opener: 'pressao' },
};

