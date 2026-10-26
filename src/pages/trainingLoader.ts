import type { ComponentType } from 'react';

// A página de formação traz o Motion; fica num pedaço separado do bundle.
// Quem abre o site direto em /training (ou o build, ao pré-renderizar) carrega antes de desenhar,
// para o HTML que já está na tela não piscar vazio enquanto o pedaço chega.
export const training: { Page?: ComponentType } = {};

export function loadTraining() {
  return import('./Training').then((module) => {
    training.Page = module.default;
    return module;
  });
}
