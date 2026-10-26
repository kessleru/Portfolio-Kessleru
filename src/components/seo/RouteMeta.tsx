import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { headTags, pageFor } from '@/seo';

// Troca o bloco de metadados do <head> (entre <!--seo--> e <!--/seo-->) ao navegar,
// com as mesmas tags que o build grava no HTML de cada página.
function RouteMeta() {
  const { pathname } = useLocation();

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
  }, [pathname]);

  return null;
}

export default RouteMeta;
