import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { headTags, pageFor } from '@/seo';
import { useLang } from '@/lib/i18n';

// Em inglês só o título da aba muda; as tags para buscadores seguem em português.
const titlesEn: Record<string, string> = {
  '/': 'Junior Full Stack Dev · Otávio Kessler Ustra',
  '/projects': 'Front-end and back-end projects · Otávio Kessler Ustra',
  '/training': 'Education and certificates · Otávio Kessler Ustra',
  '/contact': 'Contact · Otávio Kessler Ustra, Junior Full Stack Dev',
};

// Troca o bloco de metadados do <head> (entre <!--seo--> e <!--/seo-->) ao navegar,
// com as mesmas tags que o build grava no HTML de cada página.
function RouteMeta() {
  const { pathname } = useLocation();
  const { lang } = useLang();

  useEffect(() => {
    const head = document.head;
    const nodes = [...head.childNodes];
    const start = nodes.find(
      (node) => node.nodeType === Node.COMMENT_NODE && node.nodeValue === 'seo'
    );
    const end = nodes.find(
      (node) => node.nodeType === Node.COMMENT_NODE && node.nodeValue === '/seo'
    );
    if (!start || !end) return;

    while (start.nextSibling && start.nextSibling !== end) {
      start.nextSibling.remove();
    }
    const fragment = document
      .createRange()
      .createContextualFragment(headTags(pageFor(pathname)));
    head.insertBefore(fragment, end);
    if (lang === 'en')
      document.title =
        titlesEn[pathname.replace(/\/$/, '') || '/'] ??
        'Page not found · Otávio Kessler Ustra';
  }, [pathname, lang]);

  return null;
}

export default RouteMeta;
